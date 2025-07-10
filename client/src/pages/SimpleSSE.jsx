import React, { useState, useRef, useEffect } from 'react';
import './SimpleSSE.css';

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
                } catch {
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
    <div className="sse-container">
      <h2 className="sse-title">SSE打字效果演示</h2>
      
      <p>这是一个使用SSE (Server-Sent Events) 技术实现打字效果的演示。输入文本后点击发送按钮，服务器会逐字符返回输入的文本，模拟打字效果。</p>
      
      <div className="sse-example-buttons">
        <button 
          className="sse-button"
          onClick={() => handleExample("请告诉我今天的天气")} 
          disabled={isWaiting}
        >
          天气查询示例
        </button>
        <button 
          className="sse-button"
          onClick={() => handleExample("现在的时间是什么?")} 
          disabled={isWaiting}
        >
          日期时间示例
        </button>
        <button 
          className="sse-button"
          onClick={() => handleExample("给我一个待办事项清单")} 
          disabled={isWaiting}
        >
          列表示例
        </button>
      </div>
      
      <div className="sse-input-container">
        <input 
          className="sse-input"
          type="text" 
          value={userInput} 
          onChange={(e) => setUserInput(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder="输入任意文本..." 
          disabled={isWaiting}
        />
        <button 
          className="sse-button"
          onClick={handleSend} 
          disabled={isWaiting || !userInput.trim()}
        >
          发送
        </button>
      </div>
      
      <div className="sse-output-container" ref={outputRef}>
        {typingText}
        {showCursor && <span className="sse-typing-cursor"></span>}
      </div>
      
      <div className="sse-status">{status}</div>
    </div>
  );
};

export default SimpleSSE;
