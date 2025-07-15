import React, { useState, useRef, useEffect } from 'react';
import './WebSocketDemo.css';

const WebSocketDemo = () => {
  // 状态
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastHeartbeat, setLastHeartbeat] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [typingContent, setTypingContent] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  
  // 引用
  const typingAreaRef = useRef(null);
  const typingCursorRef = useRef(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (typingAreaRef.current) {
      typingAreaRef.current.scrollTop = typingAreaRef.current.scrollHeight;
    }
  }, [typingContent]);
  
  // 更新状态
  const updateStatus = (status) => {
    setConnectionStatus(status);
  };
  
  // 连接到WebSocket服务器
  const connect = () => {
    updateStatus('connecting');
    
    // Use relative path for WebSocket to leverage the Vite proxy configuration
    const wsUrl = `/ws`;
    
    try {
      const newSocket = new WebSocket(`ws://${window.location.host}${wsUrl}`);
      
      newSocket.onopen = () => {
        updateStatus('connected');
        setSocket(newSocket);
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 根据消息类型处理
          switch(data.type) {
            case 'welcome':
              // 显示欢迎消息
              break;
              
            case 'heartbeat':
              setLastHeartbeat(`上次心跳: ${data.time}`);
              break;
              
            case 'typing_start':
              setTypingContent('');
              setShowCursor(true);
              break;
              
            case 'typing_char':
              // 添加字符到打字区域
              setTypingContent(prev => prev + data.char);
              break;
              
            case 'typing_end':
              // 打字结束，移除光标
              setShowCursor(false);
              break;
          }
        } catch {
          // 处理解析错误
        }
      };
      
      newSocket.onclose = () => {
        updateStatus('disconnected');
        setSocket(null);
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket错误:', error);
        updateStatus('disconnected');
      };
    } catch (err) {
      console.error('创建WebSocket连接失败:', err);
      updateStatus('disconnected');
    }
  };
  
  // 断开WebSocket连接
  const disconnect = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  };
  
  // 发送消息
  const sendMessage = (message, type = 'chat') => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const data = {
        type: type,
        message: message,
        time: new Date().toISOString()
      };
      
      const jsonStr = JSON.stringify(data);
      socket.send(jsonStr);
      return true;
    } else {
      console.log('无法发送消息: WebSocket未连接');
      return false;
    }
  };
  
  // 处理发送消息
  const handleSendMessage = () => {
    if (messageInput.trim() && sendMessage(messageInput)) {
      setMessageInput('');
    }
  };
  
  // 处理示例按钮
  const handleExample = (text) => {
    setMessageInput(text);
  };
  
  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  return (
    <div className="ws-container">
      <h2 className="ws-title">WebSocket打字效果演示</h2>
      
      <div className="ws-status">
        <span className="ws-connection-status">
          <div className={`ws-status-indicator ${connectionStatus}`}></div>
          <span>{connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '未连接'}</span>
        </span>
        <div className="ws-heartbeat">{lastHeartbeat}</div>
      </div>
      
      <div className="ws-connection-controls">
        <button 
          className="ws-button"
          onClick={connect} 
          disabled={connectionStatus !== 'disconnected'}
        >
          连接到WebSocket服务器
        </button>
        <button 
          className="ws-button"
          onClick={disconnect} 
          disabled={connectionStatus !== 'connected'}
        >
          断开连接
        </button>
      </div>
      
      <h3>WebSocket打字效果</h3>
      <p>在下方输入一段文本，点击"发送消息"按钮，服务器将模拟打字效果返回内容。</p>
      
      <div className="ws-examples">
        <button 
          className="ws-button"
          onClick={() => handleExample("请生成一段关于WebSocket技术的描述，使用打字效果展示。")} 
          disabled={connectionStatus !== 'connected'}
        >
          长段落示例
        </button>
        <button 
          className="ws-button"
          onClick={() => handleExample("请展示一段JavaScript代码示例，演示如何创建WebSocket连接。")} 
          disabled={connectionStatus !== 'connected'}
        >
          代码示例
        </button>
      </div>
      
      <div className="ws-input-container">
        <textarea 
          className="ws-textarea"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="在这里输入要发送的消息..." 
          disabled={connectionStatus !== 'connected'}
        />
        <button 
          className="ws-button"
          onClick={handleSendMessage} 
          disabled={connectionStatus !== 'connected' || !messageInput.trim()}
        >
          发送消息
        </button>
      </div>
      
      <div className="ws-typing-area" ref={typingAreaRef}>
        {typingContent}
        {showCursor && <span className="ws-typing-cursor" ref={typingCursorRef}></span>}
      </div>
  
    </div>
  );
};

export default WebSocketDemo;
