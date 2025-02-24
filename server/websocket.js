const WebSocket = require('ws');
const Message = require('./models/message');
const User = require('./models/user');
const Friend = require('./models/friend');
const { Op } = require('sequelize');
const GroupMember = require('./models/groupMember');
const GroupMessage = require('./models/groupMessage');
const GroupMessageRead = require('./models/groupMessageRead');
const Group = require('./models/group');

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

// 修改发送群消息的函数
async function sendGroupMessage(groupId, message) {
  try {
    // 获取群组所有成员
    const members = await GroupMember.findAll({
      where: { group_id: groupId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }]
    });

    console.log(`准备向群组 ${groupId} 的 ${members.length} 名成员发送消息`);

    // 遍历所有成员发送消息
    for (const member of members) {
      const ws = clients.get(member.user_id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`向用户 ${member.user_id} 发送群消息`);
        ws.send(JSON.stringify({
          ...message,
          type: message.type // 确保消息类型正确传递
        }));
      } else {
        console.log(`用户 ${member.user_id} 不在线或WebSocket未连接`);
      }
    }

    return true;
  } catch (error) {
    console.error('发送群消息失败:', error);
    return false;
  }
}

// 发送群组申请通知
async function sendGroupRequestNotification(groupId, requestUser) {
  try {
    // 获取群组信息和管理员列表
    const group = await Group.findOne({
      where: { id: groupId },
      include: [{
        model: GroupMember,
        as: 'members',
        where: {
          role: {
            [Op.in]: ['owner', 'admin']
          }
        },
        attributes: ['user_id']
      }]
    });

    if (!group) return;

    // 获取所有需要通知的用户ID（群主和管理员）
    const notifyUserIds = group.members.map(member => member.user_id);

    // 构建通知消息
    const notification = {
      type: 'group_request',
      data: {
        requestId: requestUser.requestId,
        groupId: group.id,
        groupName: group.name,
        user: {
          id: requestUser.id,
          username: requestUser.username,
          nickname: requestUser.nickname,
          avatar: requestUser.avatar
        },
        createTime: new Date()
      }
    };

    // 向所有在线的群管理员发送通知
    notifyUserIds.forEach(userId => {
      const userSocket = clients.get(userId);
      if (userSocket) {
        userSocket.send(JSON.stringify(notification));
      }
    });

    console.log('群组申请通知已发送给管理员:', notifyUserIds);
  } catch (error) {
    console.error('发送群组申请通知失败:', error);
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
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data);
            console.log('收到WebSocket消息:', message);

            // 处理群消息
            if (message.groupId) {
              // 保存消息到数据库
              const groupMessage = await GroupMessage.create({
                group_id: message.groupId,
                from_user_id: userIdNum,
                type: message.type,
                content: message.content,
                metadata: message.metadata || null
              });

              // 获取发送者信息
              const fromUser = await User.findByPk(userIdNum, {
                attributes: ['id', 'username', 'nickname', 'avatar']
              });

              // 构建要广播的消息
              const broadcastMessage = {
                ...message,
                id: groupMessage.id,
                messageId: message.messageId,
                create_time: groupMessage.create_time,
                fromUser: {
                  id: fromUser.id,
                  username: fromUser.username,
                  nickname: fromUser.nickname,
                  avatar: fromUser.avatar
                },
                type: message.type
              };

              console.log('准备广播群消息:', broadcastMessage);

              // 广播消息给群组所有成员（包括发送者）
              await sendGroupMessage(message.groupId, broadcastMessage);

              // 发送确认消息给发送者
              ws.send(JSON.stringify({
                type: 'message_status',
                messageId: message.messageId,
                status: 'sent'
              }));
            } else {
              // 检查是否仍然是好友关系
              const isFriend = await checkFriendship(userIdNum, message.toUserId);
              if (!isFriend) {
                ws.send(JSON.stringify({
                  type: 'friend_deleted',
                  friendId: message.toUserId
                }));
                return;
              }

              // 保存消息到数据库
              const msg = await Message.create({
                fromUserId: userIdNum,
                toUserId: message.toUserId,
                type: message.type,
                content: message.content,
                metadata: message.metadata || {}
              });

              // 发送消息给发送者确认
              ws.send(JSON.stringify({
                type: 'message_status',
                messageId: message.messageId,
                status: 'sent'
              }));

              // 如果接收者在线，直接发送消息
              const recipientWs = clients.get(message.toUserId);
              if (recipientWs) {
                recipientWs.send(JSON.stringify({
                  type: message.type,
                  messageId: msg.id,
                  fromUserId: userIdNum,
                  content: message.content,
                  metadata: message.metadata || {},
                  create_time: msg.create_time,
                  fromUser: {
                    id: userIdNum,
                    username: message.fromUser?.username,
                    nickname: message.fromUser?.nickname,
                    avatar: message.fromUser?.avatar
                  }
                }));
              }
            }

            // 处理群组申请状态更新
            if (message.type === 'group_request_status') {
              if (message.requestId && message.status) {
                const notification = {
                  type: 'group_request_update',
                  data: {
                    requestId: message.requestId,
                    status: message.status,
                    groupId: message.groupId,
                    updateTime: new Date()
                  }
                };
                
                // 通知申请人
                const applicantSocket = clients.get(message.userId);
                if (applicantSocket) {
                  applicantSocket.send(JSON.stringify(notification));
                }
              }
            }
          } catch (error) {
            console.error('处理WebSocket消息失败:', error);
            ws.send(JSON.stringify({
              type: 'message_status',
              messageId: message?.messageId,
              status: 'error',
              error: '消息发送失败'
            }));
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

async function handleMessageFailed(messageId) {
  try {
    // 通知发送者消息发送失败
    const failedMessage = {
      type: 'message_failed',
      messageId: messageId
    };
    
    // 查找消息发送者的连接并发送失败通知
    const senderConnection = Array.from(clients.values())
      .find(client => client.messages?.has(messageId));
    
    if (senderConnection?.ws.readyState === WebSocket.OPEN) {
      senderConnection.ws.send(JSON.stringify(failedMessage));
    }
  } catch (error) {
    console.error('处理消息失败通知错误:', error);
  }
}

module.exports = {
  initWebSocket,
  sendFriendRequestNotification,
  sendFriendshipUpdateNotification,
  sendGroupMessage,
  sendGroupRequestNotification,
  clients
}; 