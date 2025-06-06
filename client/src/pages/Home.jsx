import React from 'react';
import { Link } from 'react-router-dom';
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

const DemoList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const DemoItem = styled.li`
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: #f9f9f9;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const DemoLink = styled(Link)`
  display: block;
  font-size: 18px;
  color: #4caf50;
  text-decoration: none;
  margin-bottom: 5px;
  
  &:hover {
    color: #45a049;
    text-decoration: underline;
  }
`;

const Description = styled.p`
  margin: 5px 0 0 0;
  color: #666;
`;

const Section = styled.section`
  margin-top: 30px;
`;

const Code = styled.span`
  font-family: monospace;
  background-color: #f0f0f0;
  padding: 2px 4px;
  border-radius: 3px;
`;

const Home = () => {
  return (
    <Container>
      <Title>SSE和WebSocket打字效果演示</Title>
      
      <p>这个项目演示了如何使用Server-Sent Events (SSE)和WebSocket技术实现打字效果。以下是可用的演示页面:</p>
      
      <DemoList>
        <DemoItem>
          <DemoLink to="/simple">简单SSE打字效果</DemoLink>
          <Description>一个简洁的示例，展示SSE的基本用法和打字效果。包含三种预设的响应模式。</Description>
        </DemoItem>
        
        <DemoItem>
          <DemoLink to="/chat">聊天界面</DemoLink>
          <Description>一个模仿聊天应用的界面，使用SSE实现AI回复的打字效果。</Description>
        </DemoItem>
        
        <DemoItem>
          <DemoLink to="/websocket">WebSocket演示</DemoLink>
          <Description>使用WebSocket实现双向通信和打字效果，包含完整的通信控制台。</Description>
        </DemoItem>
      </DemoList>
      
      <Section>
        <h2>什么是SSE?</h2>
        <p>
          Server-Sent Events (SSE) 是一种允许服务器向客户端推送数据的HTTP技术。
          与WebSocket不同，SSE是单向的，只能从服务器发送到客户端。
          SSE特别适合于需要服务器实时推送数据的场景，如通知、更新或像本演示中的打字效果。
        </p>
      </Section>
      
      <Section>
        <h2>什么是WebSocket?</h2>
        <p>
          WebSocket是一种在单个TCP连接上提供全双工通信通道的协议。
          与SSE不同，WebSocket允许服务器和客户端之间进行双向实时通信，
          适合于聊天应用、在线游戏等需要频繁、低延迟、双向通信的场景。
        </p>
      </Section>
      
      <Section>
        <h2>技术实现</h2>
        <p>
          前端使用React构建界面，通过<Code>fetch API</Code>与<Code>ReadableStream</Code>处理SSE流数据，
          通过<Code>WebSocket API</Code>处理WebSocket连接。
          后端使用Koa.js创建API，分别实现SSE和WebSocket服务。
        </p>
      </Section>
    </Container>
  );
};

export default Home;
