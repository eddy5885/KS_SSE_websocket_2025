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

async function fetchSSEStream(url, postData, onMessage) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // 你可以根据需要添加其他 header
    },
    body: JSON.stringify(postData)
  });

  if (!response.body) {
    throw new Error('ReadableStream not supported in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // 处理多条 SSE 消息
    let lines = buffer.split('\n\n');
    buffer = lines.pop(); // 最后一段可能是不完整的，留到下次

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim();
        if (dataStr === '[DONE]') {
          onMessage({ done: true });
          return;
        }
        try {
          const data = JSON.parse(dataStr);
          onMessage({ data });
        } catch (e) {
          onMessage({ error: e, raw: dataStr });
        }
      }
    }
  }
}

const Chat = () => {


  
  // 自动滚动到底部
  useEffect(() => {
    // 用法示例
fetchSSEStream(
  '/api/chatStream',
  { prompt: 'React 是什么？' }, // POST body
  ({ data, done, error, raw }) => {
    if (done) {
      console.log('流式响应结束');
    } else if (data) {
      // 这里 data.choices[0].text 就是内容片段
      console.log(data.choices[0].text);
      // 你可以把内容拼接到页面上
    } else if (error) {
      console.error('解析出错', error, raw);
    }
  }
);


  }, []);
  

  return (
    <Container>
      <Title>AI对话打字效果演示</Title>

      
      <InputContainer>

      </InputContainer>
      
    </Container>
  );
};

export default Chat;
