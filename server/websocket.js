const WebSocket = require('ws');
const Message = require('./models/message');
const User = require('./models/user');
const Friend = require('./models/friend');
const { Op } = require('sequelize');

// 存储在线用户的WebSocket连接
const clients = new Map();
// 存储用户在线状态
const onlineStatus = new Map();

// 消息队列
const messageQueue = new Map();

// 消息确认超时时间(ms)
const MESSAGE_TIMEOUT = 10000;

// 重试次数
const MAX_RETRIES = 3;

// 消息同步管理器
class MessageSyncManager {
  constructor(ws, userId) {
    this.ws = ws;
    this.userId = userId;
    this.messageQueue = new Map();
    this.retryCount = new Map();
  }

  // 添加消息到队列
  addMessage(message) {
    const messageId = message.id;
    this.messageQueue.set(messageId, message);
    this.scheduleRetry(messageId);
    
    // 发送消息
    this.sendMessage(messageId);
  }

  // 发送消息
  sendMessage(messageId) {
    const message = this.messageQueue.get(messageId);
    if (!message) return;

    this.ws.send(JSON.stringify({
      type: message.type,
      messageId,
      ...message
    }));
  }

  // 安排重试
  scheduleRetry(messageId) {
    setTimeout(() => {
      this.retryMessage(messageId);
    }, MESSAGE_TIMEOUT);
  }

  // 重试消息
  retryMessage(messageId) {
    const retryCount = this.retryCount.get(messageId) || 0;
    if (retryCount >= MAX_RETRIES) {
      // 达到最大重试次数，将消息标记为发送失败
      this.handleMessageFailed(messageId);
      return;
    }

    if (this.messageQueue.has(messageId)) {
      this.retryCount.set(messageId, retryCount + 1);
      this.sendMessage(messageId);
      this.scheduleRetry(messageId);
    }
  }

  // 确认消息
  confirmMessage(messageId) {
    this.messageQueue.delete(messageId);
    this.retryCount.delete(messageId);
  }

  // 处理消息发送失败
  handleMessageFailed(messageId) {
    const message = this.messageQueue.get(messageId);
    if (!message) return;

    // 存储失败消息到数据库
    Message.create({
      ...message,
      status: 'failed'
    }).catch(console.error);

    this.messageQueue.delete(messageId);
    this.retryCount.delete(messageId);

    // 通知客户端消息发送失败
    this.ws.send(JSON.stringify({
      type: 'message_failed',
      messageId
    }));
  }

  // 清理
  cleanup() {
    this.messageQueue.clear();
    this.retryCount.clear();
  }
}

// 获取用户的好友ID列表
async function getFriendIds(userId) {
  if (!userId || isNaN(userId)) {
    throw new Error('无效的用户ID');
  }

  const friends = await Friend.findAll({
    where: {
      status: 'accepted',
      [Op.or]: [
        { userId: userId },
        { friendId: userId }
      ]
    }
  });

  return [...new Set(friends.map(friend => 
    friend.userId === userId ? friend.friendId : friend.userId
  ))];
}

// 检查是否是好友关系
async function checkFriendship(userId1, userId2) {
  if (!userId1 || !userId2 || isNaN(userId1) || isNaN(userId2)) {
    return false;
  }

  const friend = await Friend.findOne({
    where: {
      status: 'accepted',
      [Op.or]: [
        { userId: userId1, friendId: userId2 },
        { userId: userId2, friendId: userId1 }
      ]
    }
  });
  return !!friend;
}

// 广播在线状态给所有好友
async function broadcastStatus(userId, status) {
  if (!userId || isNaN(userId)) {
    throw new Error('无效的用户ID');
  }

  try {
    const friendIds = await getFriendIds(userId);
    for (const friendId of friendIds) {
      const friendWs = clients.get(friendId);
      if (friendWs) {
        friendWs.send(JSON.stringify({
          type: 'status',
          userId: userId,
          status: status
        }));
      }
    }
  } catch (error) {
    console.error('广播在线状态失败:', error);
  }
}

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws, req) => {
    try {
      // 使用URL对象正确解析查询参数
      const url = new URL(req.url, 'ws://localhost');
      const userId = url.searchParams.get('userId');

      if (!userId || isNaN(userId)) {
        console.error('无效的用户ID:', userId);
        ws.close();
        return;
      }
      
      const userIdNum = parseInt(userId);
      
      // 验证用户ID是否为正数
      if (userIdNum <= 0) {
        console.error('无效的用户ID:', userIdNum);
        ws.close();
        return;
      }

      console.log('WebSocket连接已建立，用户ID:', userIdNum);
      
      // 存储连接
      clients.set(userIdNum, ws);
      onlineStatus.set(userIdNum, true);

      // 广播上线状态给所有好友
      try {
        await broadcastStatus(userIdNum, 'online');

        // 获取该用户的所有好友ID
        const friendIds = await getFriendIds(userIdNum);

        // 发送所有在线好友的状态给当前用户
        for (const friendId of friendIds) {
          if (onlineStatus.get(friendId)) {
            ws.send(JSON.stringify({
              type: 'status',
              userId: friendId,
              status: 'online'
            }));
          }
        }

        // 在connection事件中初始化MessageSyncManager
        const syncManager = new MessageSyncManager(ws, userIdNum);

        // 处理消息
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            console.log('收到消息:', data);
            
            switch (data.type) {
              case 'text':
              case 'image':
              case 'file':
              case 'question_bank':
                // 检查是否仍然是好友关系
                const isFriend = await checkFriendship(userIdNum, data.toUserId);
                if (!isFriend) {
                  ws.send(JSON.stringify({
                    type: 'friend_deleted',
                    friendId: data.toUserId
                  }));
                  return;
                }

                // 保存消息到数据库
                const msg = await Message.create({
                  fromUserId: userIdNum,
                  toUserId: data.toUserId,
                  type: data.type,
                  content: data.content,
                  metadata: data.metadata || {}
                });

                // 发送消息给发送者确认
                ws.send(JSON.stringify({
                  type: 'message_status',
                  messageId: data.messageId,
                  status: 'sent'
                }));

                // 如果接收者在线，直接发送消息
                const recipientWs = clients.get(data.toUserId);
                if (recipientWs) {
                  recipientWs.send(JSON.stringify({
                    type: data.type,
                    messageId: msg.id,
                    fromUserId: userIdNum,
                    content: data.content,
                    metadata: data.metadata || {},
                    create_time: msg.create_time,
                    fromUser: {
                      id: userIdNum,
                      username: data.fromUser?.username,
                      nickname: data.fromUser?.nickname,
                      avatar: data.fromUser?.avatar
                    }
                  }));
                }
                break;

              case 'read':
                await Message.update(
                  { isRead: true },
                  { where: { id: data.messageId } }
                );
                break;

              case 'message_ack':
                syncManager.confirmMessage(data.messageId);
                break;
            }
          } catch (error) {
            console.error('WebSocket消息处理错误:', error);
          }
        });

        // 处理连接关闭
        ws.on('close', async () => {
          clients.delete(userIdNum);
          onlineStatus.delete(userIdNum);
          
          // 广播离线状态给所有好友
          await broadcastStatus(userIdNum, 'offline');

          // 清理MessageSyncManager
          syncManager.cleanup();
        });

        // 发送未处理的好友请求数量
        try {
          const pendingRequests = await Friend.count({
            where: {
              friendId: userIdNum,
              status: 'pending'
            }
          });
          
          if (pendingRequests > 0) {
            ws.send(JSON.stringify({
              type: 'friend_request_count',
              count: pendingRequests
            }));
          }
        } catch (error) {
          console.error('获取好友请求数量失败:', error);
        }
      } catch (error) {
        console.error('WebSocket连接初始化失败:', error);
        ws.close();
      }
    } catch (error) {
      console.error('WebSocket连接建立失败:', error);
      ws.close();
    }
  });

  return wss;
}

// 发送好友请求通知
function sendFriendRequestNotification(toUserId, fromUser) {
  const recipientWs = clients.get(toUserId);
  if (recipientWs) {
    recipientWs.send(JSON.stringify({
      type: 'new_friend_request',
      fromUser: {
        id: fromUser.id,
        username: fromUser.username,
        nickname: fromUser.nickname,
        avatar: fromUser.avatar
      }
    }));
  }
}

// 发送好友关系更新通知
function sendFriendshipUpdateNotification(userId1, userId2, action) {
  const user1Ws = clients.get(userId1);
  const user2Ws = clients.get(userId2);

  if (action === 'deleted') {
    // 只通知被删除的一方
    if (user2Ws) {
      user2Ws.send(JSON.stringify({
        type: 'friend_deleted',
        friendId: userId1
      }));
    }
  } else {
    // 其他更新通知双方
    const notification = {
      type: 'friendship_update',
      action: action
    };

    if (user1Ws) {
      user1Ws.send(JSON.stringify(notification));
    }
    if (user2Ws) {
      user2Ws.send(JSON.stringify(notification));
    }
  }
}

module.exports = {
  initWebSocket,
  sendFriendRequestNotification,
  sendFriendshipUpdateNotification
}; 