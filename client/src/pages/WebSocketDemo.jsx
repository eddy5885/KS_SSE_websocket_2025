import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
`;

const Title = styled.h1`
  text-align: center;
  color: #2c3e50;
  margin-bottom: 20px;
`;

const Status = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const ConnectionControls = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 15px;
`;

const Tab = styled.div`
  padding: 10px 15px;
  cursor: pointer;
  background-color: ${props => props.active ? '#f0f0f0' : 'transparent'};
  border-bottom: 2px solid ${props => props.active ? '#4caf50' : 'transparent'};
  
  &:hover {
    background-color: #f9f9f9;
  }
`;

const Section = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
  margin-bottom: 20px;
`;

const TypingArea = styled.div`
  height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  background-color: #f9f9f9;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const TypingCursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: #333;
  margin-left: 2px;
  animation: cursor-blink 1s step-start infinite;
  
  @keyframes cursor-blink {
    50% { opacity: 0; }
  }
`;

const Console = styled.div`
  height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  background-color: #f9f9f9;
  font-family: monospace;
  font-size: 14px;
  margin-bottom: 15px;
`;

const ConsoleEntry = styled.div`
  margin-bottom: 5px;
  padding: 5px;
  border-radius: 3px;
  background-color: ${props => {
    switch(props.type) {
      case 'sent': return 'rgba(76, 175, 80, 0.1)';
      case 'received': return 'rgba(33, 150, 243, 0.1)';
      case 'error': return 'rgba(244, 67, 54, 0.1)';
      default: return 'transparent';
    }
  }};
  color: ${props => props.type === 'error' ? '#f44336' : 'inherit'};
`;

const ConsoleTime = styled.span`
  color: #999;
  margin-right: 10px;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const Examples = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-family: inherit;
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => {
    switch(props.status) {
      case 'connected': return '#4caf50';
      case 'connecting': return '#ff9800';
      default: return '#f44336';
    }
  }};
  margin-right: 6px;
`;

const ConnectionStatus = styled.span`
  display: flex;
  align-items: center;
`;

const Heartbeat = styled.div`
  font-size: 0.8em;
  color: #666;
`;

const Code = styled.span`
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
`;

const Pre = styled.pre`
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  margin: 15px 0;
`;

const Explanation = styled.div`
  margin-top: 30px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: #f9f9f9;
  
  h3 {
    margin-top: 0;
  }
`;

const WebSocketDemo = () => {
  // 状态
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastHeartbeat, setLastHeartbeat] = useState('');
  const [activeTab, setActiveTab] = useState('demo');
  const [messageInput, setMessageInput] = useState('');
  const [customMessageInput, setCustomMessageInput] = useState('');
  const [typingContent, setTypingContent] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  
  // 引用
  const consoleRef = useRef(null);
  const typingAreaRef = useRef(null);
  const typingCursorRef = useRef(null);
  
  // 控制台日志
  const [consoleLogs, setConsoleLogs] = useState([]);
  
  // 自动滚动到底部
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
    if (typingAreaRef.current) {
      typingAreaRef.current.scrollTop = typingAreaRef.current.scrollHeight;
    }
  }, [consoleLogs, typingContent]);
  
  // 更新状态
  const updateStatus = (status) => {
    setConnectionStatus(status);
  };
  
  // 添加控制台日志
  const addConsoleLog = (message, type = 'system') => {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN');
    
    setConsoleLogs(prev => [...prev, {
      id: Date.now(),
      time,
      message,
      type
    }]);
  };
  
  // 连接到WebSocket服务器
  const connect = () => {
    updateStatus('connecting');
    
    // Use relative path for WebSocket to leverage the Vite proxy configuration
    const wsUrl = `/ws`;
    
    try {
      const newSocket = new WebSocket(`ws://${window.location.host}${wsUrl}`);
      
      newSocket.onopen = () => {
        addConsoleLog('WebSocket连接已建立');
        updateStatus('connected');
        setSocket(newSocket);
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addConsoleLog(data, 'received');
          
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
          addConsoleLog(`无法解析消息: ${event.data}`, 'error');
        }
      };
      
      newSocket.onclose = (event) => {
        addConsoleLog(`WebSocket连接已关闭: 代码=${event.code} 原因=${event.reason || '未知'}`);
        updateStatus('disconnected');
        setSocket(null);
      };
      
      newSocket.onerror = (error) => {
        addConsoleLog('WebSocket错误', 'error');
        console.error('WebSocket错误:', error);
        updateStatus('disconnected');
      };
    } catch (err) {
      console.error('创建WebSocket连接失败:', err);
      addConsoleLog(`创建WebSocket连接失败: ${err.message}`, 'error');
      updateStatus('disconnected');
    }
  };
  
  // 断开WebSocket连接
  const disconnect = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
      addConsoleLog('已手动断开连接');
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
      addConsoleLog(data, 'sent');
      return true;
    } else {
      addConsoleLog('无法发送消息: WebSocket未连接', 'error');
      return false;
    }
  };
  
  // 发送自定义消息
  const sendCustomMessage = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(jsonString);
        addConsoleLog(data, 'sent');
        return true;
      } else {
        addConsoleLog('无法发送消息: WebSocket未连接', 'error');
        return false;
      }
    } catch {
      addConsoleLog('无效的JSON格式', 'error');
      return false;
    }
  };
  
  // 清除控制台
  const clearConsole = () => {
    setConsoleLogs([]);
    addConsoleLog('控制台已清除');
  };
  
  // 处理发送消息
  const handleSendMessage = () => {
    if (messageInput.trim() && sendMessage(messageInput)) {
      setMessageInput('');
    }
  };
  
  // 处理发送自定义消息
  const handleSendCustomMessage = () => {
    if (customMessageInput.trim()) {
      if (sendCustomMessage(customMessageInput)) {
        setCustomMessageInput('');
      }
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
  
  // 初始化日志
  useEffect(() => {
    addConsoleLog('WebSocket控制台已初始化');
  }, []);

  return (
    <Container>
      <Title>WebSocket打字效果演示</Title>
      
      <Status>
        <ConnectionStatus>
          <StatusIndicator status={connectionStatus} />
          <span>{connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '未连接'}</span>
        </ConnectionStatus>
        <Heartbeat>{lastHeartbeat}</Heartbeat>
      </Status>
      
      <ConnectionControls>
        <Button 
          onClick={connect} 
          disabled={connectionStatus !== 'disconnected'}
        >
          连接到WebSocket服务器
        </Button>
        <Button 
          onClick={disconnect} 
          disabled={connectionStatus !== 'connected'}
        >
          断开连接
        </Button>
      </ConnectionControls>
      
      <Tabs>
        <Tab 
          active={activeTab === 'demo'} 
          onClick={() => setActiveTab('demo')}
        >
          打字效果演示
        </Tab>
        <Tab 
          active={activeTab === 'console'} 
          onClick={() => setActiveTab('console')}
        >
          WebSocket控制台
        </Tab>
      </Tabs>
      
      <Section active={activeTab === 'demo'}>
        <h3>WebSocket打字效果</h3>
        <p>在下方输入一段文本，点击"发送消息"按钮，服务器将模拟打字效果返回内容。</p>
        
        <Examples>
          <Button 
            onClick={() => handleExample("请生成一段关于WebSocket技术的描述，使用打字效果展示。")} 
            disabled={connectionStatus !== 'connected'}
          >
            长段落示例
          </Button>
          <Button 
            onClick={() => handleExample("请展示一段JavaScript代码示例，演示如何创建WebSocket连接。")} 
            disabled={connectionStatus !== 'connected'}
          >
            代码示例
          </Button>
        </Examples>
        
        <InputContainer>
          <TextArea 
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="在这里输入要发送的消息..." 
            disabled={connectionStatus !== 'connected'}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={connectionStatus !== 'connected' || !messageInput.trim()}
          >
            发送消息
          </Button>
        </InputContainer>
        
        <TypingArea ref={typingAreaRef}>
          {typingContent}
          {showCursor && <TypingCursor ref={typingCursorRef} />}
        </TypingArea>
      </Section>
      
      <Section active={activeTab === 'console'}>
        <h3>WebSocket通信日志</h3>
        <p>这里显示与服务器之间的所有WebSocket通信。</p>
        
        <InputContainer>
          <Input 
            type="text" 
            value={customMessageInput}
            onChange={(e) => setCustomMessageInput(e.target.value)}
            placeholder="输入自定义JSON消息..." 
            disabled={connectionStatus !== 'connected'}
          />
          <Button 
            onClick={handleSendCustomMessage} 
            disabled={connectionStatus !== 'connected' || !customMessageInput.trim()}
          >
            发送
          </Button>
          <Button 
            onClick={() => sendMessage('ping', 'ping')} 
            disabled={connectionStatus !== 'connected'}
          >
            Ping
          </Button>
          <Button onClick={clearConsole}>清除日志</Button>
        </InputContainer>
        
        <Console ref={consoleRef}>
          {consoleLogs.map(log => (
            <ConsoleEntry key={log.id} type={log.type}>
              <ConsoleTime>{log.time}</ConsoleTime>
              <span>{typeof log.message === 'object' ? JSON.stringify(log.message, null, 2) : log.message}</span>
            </ConsoleEntry>
          ))}
        </Console>
        
        <div>
          <h4>测试消息格式：</h4>
          <Pre>{`{
  "type": "chat",
  "message": "测试消息内容"
}`}</Pre>
        </div>
      </Section>
      
      <Explanation>
        <h3>WebSocket vs SSE 比较</h3>
        <p>
          <strong>WebSocket</strong>是一种在单个TCP连接上提供全双工通信通道的协议。WebSocket允许服务器和客户端之间进行双向实时通信。
          相比之下，<strong>Server-Sent Events (SSE)</strong>是单向的，只允许服务器向客户端推送数据。
        </p>
        <p>
          <strong>WebSocket优点：</strong>
        </p>
        <ul>
          <li>支持双向通信</li>
          <li>更好的实时性能</li>
          <li>支持二进制数据传输</li>
        </ul>
        <p>
          <strong>SSE优点：</strong>
        </p>
        <ul>
          <li>实现简单（基于HTTP）</li>
          <li>自动重连机制</li>
          <li>与现有HTTP基础设施更兼容</li>
        </ul>
      </Explanation>
    </Container>
  );
};

export default WebSocketDemo;
