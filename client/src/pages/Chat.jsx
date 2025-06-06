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

const ChatContainer = styled.div`
  height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
  background-color: #f9f9f9;
  margin-bottom: 20px;
`;

const Message = styled.div`
  margin-bottom: 15px;
  padding: 10px 15px;
  border-radius: 18px;
  max-width: 80%;
  word-wrap: break-word;
`;

const UserMessage = styled(Message)`
  background-color: #dcf8c6;
  margin-left: auto;
  margin-right: 10px;
  text-align: right;
  border-bottom-right-radius: 5px;
`;

const AIMessage = styled(Message)`
  background-color: #f1f0f0;
  margin-left: 10px;
  border-bottom-left-radius: 5px;
  
  &.typing::after {
    content: '▌';
    animation: cursor-blink 1s step-start infinite;
  }
  
  @keyframes cursor-blink {
    50% { opacity: 0; }
  }
`;

const PreText = styled.pre`
  white-space: pre-wrap;
  margin: 0;
  font-family: inherit;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const Textarea = styled.textarea`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-family: inherit;
  resize: none;
  height: 60px;
`;

const Button = styled.button`
  padding: 0 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const StatusText = styled.div`
  margin-top: 10px;
  font-size: 14px;
  color: #666;
  text-align: center;
`;

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
                } catch (e) {
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
    <Container>
      <Title>AI对话打字效果演示</Title>
      
      <ChatContainer ref={chatContainerRef}>
        {messages.map((message) => (
          message.type === 'user' ? (
            <UserMessage key={message.id}>
              <PreText>{message.content}</PreText>
            </UserMessage>
          ) : (
            <AIMessage 
              key={message.id} 
              className={message.isTyping ? 'typing' : ''}
            >
              <PreText>{message.content}</PreText>
            </AIMessage>
          )
        ))}
      </ChatContainer>
      
      <InputContainer>
        <Textarea 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请输入您的问题..."
          disabled={isWaitingResponse}
        />
        <Button 
          onClick={handleSendMessage}
          disabled={isWaitingResponse || inputText.trim() === ''}
        >
          发送
        </Button>
      </InputContainer>
      
      <StatusText>{status}</StatusText>
    </Container>
  );
};

export default Chat;
