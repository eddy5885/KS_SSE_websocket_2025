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

const OutputContainer = styled.div`
  height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  background-color: #f9f9f9;
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.6;
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

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
`;

const ExampleButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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

const Status = styled.div`
  margin-top: 10px;
  font-size: 14px;
  color: #666;
  text-align: center;
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
  font-family: monospace;
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

const SimpleSSE = () => {
  const [userInput, setUserInput] = useState('');
  const [typingText, setTypingText] = useState('');
  const [status, setStatus] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const outputRef = useRef(null);
  
  // 自动滚动到底部
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [typingText]);
  
  // 生成随机UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // 连接SSE
  const connectSSE = (prompt) => {
    // 重置状态
    setTypingText('');
    setShowCursor(true);
    setIsWaiting(true);
    setStatus('正在处理...');

    // 使用fetch API创建POST请求的SSE连接
    fetch(`/api/sse?uuid=${encodeURIComponent(generateUUID())}`, {
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
      
      // 处理和读取流数据
      function readStream() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            finishTyping();
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
                finishTyping();
              } else if (eventType === 'error') {
                let errorMsg = '发生错误';
                try {
                  const parsedError = JSON.parse(eventData);
                  errorMsg = parsedError.message || '未知错误';
                } catch(e) {
                  errorMsg = eventData;
                }
                setTypingText(prev => prev + `\n[错误: ${errorMsg}]`);
                finishTyping();
              }
            } else if (dataMatch) {
              // 处理数据行
              try {
                const parsedData = JSON.parse(dataMatch[1]);
                if (parsedData.text) {
                  setTypingText(prev => prev + parsedData.text);
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
        setTypingText(prev => prev + `\n[错误: ${error.message}]`);
        finishTyping();
      });
    })
    .catch(error => {
      console.error('连接错误:', error);
      setStatus(`错误: ${error.message}`);
      finishTyping();
    });
  };
  
  // 结束打字效果
  const finishTyping = () => {
    setIsWaiting(false);
    setShowCursor(false);
    setStatus('');
  };
  
  // 处理发送消息
  const handleSend = () => {
    if (userInput.trim() && !isWaiting) {
      connectSSE(userInput.trim());
    }
  };
  
  // 处理按Enter键发送
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isWaiting) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // 示例按钮处理
  const handleExample = (text) => {
    if (!isWaiting) {
      setUserInput(text);
      connectSSE(text);
    }
  };

  return (
    <Container>
      <Title>SSE打字效果演示</Title>
      
      <p>这是一个使用SSE (Server-Sent Events) 技术实现打字效果的演示。输入文本后点击发送按钮，服务器会逐字符返回输入的文本，模拟打字效果。</p>
      
      <ExampleButtons>
        <Button 
          onClick={() => handleExample("请告诉我今天的天气")} 
          disabled={isWaiting}
        >
          天气查询示例
        </Button>
        <Button 
          onClick={() => handleExample("现在的时间是什么?")} 
          disabled={isWaiting}
        >
          日期时间示例
        </Button>
        <Button 
          onClick={() => handleExample("给我一个待办事项清单")} 
          disabled={isWaiting}
        >
          列表示例
        </Button>
      </ExampleButtons>
      
      <InputContainer>
        <Input 
          type="text" 
          value={userInput} 
          onChange={(e) => setUserInput(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="输入任意文本..." 
          disabled={isWaiting}
        />
        <Button onClick={handleSend} disabled={isWaiting || !userInput.trim()}>
          发送
        </Button>
      </InputContainer>
      
      <OutputContainer ref={outputRef}>
        {typingText}
        {showCursor && <TypingCursor />}
      </OutputContainer>
      
      <Status>{status}</Status>
      
      <Explanation>
        <h3>技术说明:</h3>
        <p>
          Server-Sent Events (SSE) 是一种允许服务器向客户端推送数据的技术。
          与WebSocket不同，SSE是单向的，只能从服务器发送到客户端。前端使用
          <Code>fetch API</Code>与<Code>ReadableStream</Code>
          处理流数据。
        </p>
        <Pre>
{`fetch('/api/sse', { 
    method: 'POST', 
    body: JSON.stringify({ prompt }) 
})
.then(response => {
    const reader = response.body.getReader();
    return reader.read().then(function process({ done, value }) {
        // 处理流数据...
    });
});`}
        </Pre>
      </Explanation>
    </Container>
  );
};

export default SimpleSSE;
