class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.heartbeatInterval = null;
    this.messageCallbacks = new Map();
    this.pendingMessages = new Map();
    this.onlineStatuses = new Map();
    this.connected = false;
  }

  connect(userId) {
    return new Promise((resolve, reject) => {
      if (!userId || isNaN(userId)) {
        console.error('无效的用户ID:', userId);
        reject(new Error('无效的用户ID'));
        return;
      }

      if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.userId = userId;
      console.log('正在连接WebSocket服务器...', userId);
      
      try {
        const wsUrl = new URL(this.url);
        wsUrl.searchParams.set('userId', userId);
        this.ws = new WebSocket(wsUrl.toString());

        this.ws.onopen = () => {
          console.log('WebSocket连接成功');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processPendingMessages();
          resolve();
        };

        this.ws.onclose = () => {
          console.log('WebSocket连接关闭');
          this.connected = false;
          this.clearHeartbeat();
          this.onlineStatuses.clear();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          this.connected = false;
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        console.error('创建WebSocket连接失败:', error);
        reject(error);
      }
    });
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('收到WebSocket消息:', message);

      switch (message.type) {
        case 'text':
        case 'image':
        case 'file':
          this.handleChatMessage(message);
          break;
        case 'status':
          this.handleStatusUpdate(message);
          break;
        case 'online_status_list':
          this.handleStatusList(message);
          break;
        case 'message_status':
          this.handleMessageStatus(message);
          break;
        case 'message_failed':
          this.handleMessageFailed(message.messageId);
          break;
        default:
          const callback = this.messageCallbacks.get(message.type);
          if (callback) {
            callback(message);
          }
      }
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  }

  handleStatusUpdate(message) {
    console.log('处理状态更新:', message);
    this.onlineStatuses.set(parseInt(message.userId), message.status === 'online');
    const callback = this.messageCallbacks.get('status');
    if (callback) {
      callback(message);
    }
  }

  handleStatusList(message) {
    console.log('处理状态列表:', message);
    Object.entries(message.statuses).forEach(([userId, status]) => {
      this.onlineStatuses.set(parseInt(userId), status === 'online');
    });
    const callback = this.messageCallbacks.get('online_status_list');
    if (callback) {
      callback(message);
    }
  }

  handleChatMessage(message) {
    console.log('处理聊天消息:', message);
    // 确认消息接收
    if (message.messageId) {
      this.sendMessageConfirmation(message.messageId);
    }

    const callback = this.messageCallbacks.get(message.type);
    if (callback) {
      callback(message);
    }
  }

  handleMessageStatus(message) {
    console.log('处理消息状态:', message);
    const callback = this.messageCallbacks.get('message_status');
    if (callback) {
      callback(message);
    }
  }

  sendMessageConfirmation(messageId) {
    if (!messageId) {
      console.warn('消息ID为空，无法发送确认');
      return;
    }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      const confirmationMessage = {
        type: 'message_received',
        messageId
      };
      console.log('发送消息确认:', confirmationMessage);
      this.ws.send(JSON.stringify(confirmationMessage));
    }
  }

  isUserOnline(userId) {
    const isOnline = this.onlineStatuses.get(parseInt(userId)) || false;
    console.log(`检查用户 ${userId} 在线状态:`, isOnline);
    return isOnline;
  }

  sendMessage(type, data) {
    const messageId = this.generateMessageId();
    const message = {
      type,
      messageId,
      ...data,
      timestamp: Date.now()
    };

    console.log('发送消息:', message);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，消息将加入待发送队列');
      this.pendingMessages.set(messageId, message);
    }

    return messageId;
  }

  processPendingMessages() {
    for (const [messageId, message] of this.pendingMessages) {
      this.ws.send(JSON.stringify(message));
      this.pendingMessages.delete(messageId);
    }
  }

  onMessage(type, callback) {
    this.messageCallbacks.set(type, callback);
  }

  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  close() {
    this.clearHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }

  handleMessageFailed(messageId) {
    console.error('Message failed:', messageId);
    // 在实际应用中，你可能需要在这里更新 UI，显示消息发送失败
  }

  startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage('heartbeat', {}); // 发送心跳消息
      }
    }, 30000); // 30秒发送一次心跳
  }

  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  handleReconnect() {
    this.clearHeartbeat();
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`尝试重新连接，第 ${this.reconnectAttempts} 次`);
        this.connect(this.userId).catch(console.error);
      }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts)); // 指数退避
    } else {
      console.log('达到最大重连次数，停止重连');
    }
  }
}

export const wsClient = new WebSocketClient('ws://localhost:3000');