import React, { useState, useRef, useEffect } from 'react';
import './ChatSSE.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [status, setStatus] = useState('');
  const chatContainerRef = useRef(null);
  
  // 生成随机UUID作为会话标识
  const uuid = useRef(generateUUID());
  
  // 自动滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // 初始欢迎信息
  useEffect(() => {
    setMessages([
      { type: 'ai', content: '你好！我是AI助手，有什么可以帮助您的？', id: 'welcome' }
    ]);
  }, []);

  // 生成随机UUID
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 发送消息
  const handleSendMessage = () => {
    if (inputText.trim() === '' || isWaitingResponse) {
      return;
    }
    
    // 添加用户消息
    const messageId = Date.now().toString();
    setMessages(prev => [...prev, { type: 'user', content: inputText.trim(), id: messageId }]);
    
    // 清空输入框
    setInputText('');
    
    // 设置状态
    setIsWaitingResponse(true);
    setStatus('AI正在思考中...');
    
    // 创建AI消息占位
    const aiMessageId = 'ai-' + Date.now().toString();
    setMessages(prev => [...prev, { type: 'ai', content: '', id: aiMessageId, isTyping: true }]);
    
    // 连接到SSE
    connectSSE(inputText.trim(), aiMessageId);
  };
  
  // 连接到SSE
  const connectSSE = (prompt, messageId) => {
    // 使用fetch API创建POST请求的SSE连接
    fetch(`/api/sse?uuid=${encodeURIComponent(uuid.current)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })
    .then(response => {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentContent = '';
      
      // 读取和处理流数据
      function readStream() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            finishResponseMessage(messageId, currentContent);
            return;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // 处理事件流
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            const eventMatch = line.match(/^event: (.+)$/m);
            const dataMatch = line.match(/^data: (.+)$/m);
            
            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1];
              const eventData = dataMatch[1];
              
              if (eventType === 'start') {
                setStatus('正在接收响应...');
              } else if (eventType === 'end') {
                finishResponseMessage(messageId, currentContent);
              } else if (eventType === 'error') {
                let errorMessage = '发生错误';
                try {
                  const parsedError = JSON.parse(eventData);
                  errorMessage = parsedError.message || '未知错误';
                } catch {
                  errorMessage = eventData || '未知错误';
                }
                finishResponseMessage(messageId, `错误：${errorMessage}`);
                setStatus(`错误: ${errorMessage}`);
              }
            } else if (dataMatch) {
              // 处理数据行
              try {
                const parsedData = JSON.parse(dataMatch[1]);
                if (parsedData.text) {
                  currentContent += parsedData.text;
                  updateMessageContent(messageId, currentContent);
                }
              } catch (e) {
                console.error('解析数据错误:', e);
              }
            }
          }
          
          return readStream();
        });
      }
      
      readStream().catch(error => {
        console.error('流读取错误:', error);
        finishResponseMessage(messageId, `发生错误，请重试: ${error.message}`);
        setStatus(`错误: ${error.message}`);
      });
    })
    .catch(error => {
      console.error('连接错误:', error);
      finishResponseMessage(messageId, '连接失败，请重试');
      setStatus('连接错误，请检查网络');
    });
  };
  
  // 更新消息内容
  const updateMessageContent = (id, content) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, content } : msg
      )
    );
  };
  
  // 结束响应消息
  const finishResponseMessage = (id, finalContent) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === id ? { ...msg, content: finalContent, isTyping: false } : msg
      )
    );
    
    setIsWaitingResponse(false);
    setStatus('');
  };
  
  // 按Enter键发送消息
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">AI对话打字效果演示</h2>
      
      <div className="chat-messages" ref={chatContainerRef}>
        {messages.map((message) => (
          message.type === 'user' ? (
            <div key={message.id} className="message user-message">
              <pre className="pre-text">{message.content}</pre>
            </div>
          ) : (
            <div 
              key={message.id} 
              className={`message ai-message ${message.isTyping ? 'typing' : ''}`}
            >
              <pre className="pre-text">{message.content}</pre>
            </div>
          )
        ))}
      </div>
      
      <div className="chat-input-container">
        <textarea 
          className="chat-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入您的问题..."
          disabled={isWaitingResponse}
        />
        <button 
          className="chat-button"
          onClick={handleSendMessage}
          disabled={isWaitingResponse || inputText.trim() === ''}
        >
          发送
        </button>
      </div>
      
      <div className="chat-status">{status}</div>
    </div>
  );
};

export default Chat;
