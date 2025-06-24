const WebSocket = require('ws');

/**
 * 初始化WebSocket服务
 * @param {Object} server - HTTP服务器实例
 */
function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket客户端已连接');
    
    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'welcome',
      message: '欢迎连接到WebSocket服务器'
    }));
    
    // 设置一个心跳检测，每5秒发送一次当前时间
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          time: new Date().toLocaleString('zh-CN'),
          timestamp: Date.now()
        }));
      }
    }, 5000);
    
    // 接收客户端消息
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('收到客户端消息:', data);
        
        // 根据消息类型处理
        switch (data.type) {
          case 'chat':
            // 模拟打字效果，字符一个个发送
            simulateTyping(ws, data.message);
            break;
            
          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              time: new Date().toLocaleString('zh-CN')
            }));
            break;
            
          default:
            // 简单的回显消息
            ws.send(JSON.stringify({
              type: 'echo',
              message: data.message,
              received: true,
              time: new Date().toLocaleString('zh-CN')
            }));
        }
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: '消息格式错误，请发送有效的JSON'
        }));
      }
    });
    
    // 客户端断开连接
    ws.on('close', () => {
      console.log('WebSocket客户端已断开连接');
      clearInterval(heartbeat);
    });
    
    // 发生错误
    ws.on('error', (error) => {
      console.error('WebSocket错误:', error);
      clearInterval(heartbeat);
    });
  });
  
  return wss;
}

/**
 * 模拟打字效果，字符一个个发送
 * @param {WebSocket} ws - WebSocket连接
 * @param {string} message - 要发送的消息
 */
function simulateTyping(ws, message) {
  if (!message) return;
  
  // 先发送开始事件
  ws.send(JSON.stringify({
    type: 'typing_start',
    time: new Date().toLocaleString('zh-CN')
  }));
  
  const chars = message.split('');
  let index = 0;
  
  // 使用递归函数逐个发送字符
  function sendChar() {
    if (index < chars.length && ws.readyState === WebSocket.OPEN) {
      // 发送当前字符
      ws.send(JSON.stringify({
        type: 'typing_char',
        char: chars[index],
        index: index
      }));
      
      index++;
      
      // 随机延迟，模拟打字效果
      setTimeout(sendChar, Math.random() * 100 + 50);
    } else {
      // 发送结束事件
      ws.send(JSON.stringify({
        type: 'typing_end',
        message: message,
        time: new Date().toLocaleString('zh-CN')
      }));
    }
  }
  
  // 开始发送
  sendChar();
}

module.exports = initWebSocketServer;
