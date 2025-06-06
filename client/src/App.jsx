import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled from 'styled-components';
import Home from './pages/Home';
import SimpleSSE from './pages/SimpleSSE';
import Chat from './pages/Chat';
import WebSocketDemo from './pages/WebSocketDemo';

// 样式化组件
const AppContainer = styled.div`
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20px;
`;

const Nav = styled.nav`
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 15px;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: #4caf50;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(76, 175, 80, 0.1);
    color: #45a049;
  }

  &.active {
    background-color: #4caf50;
    color: white;
  }
`;

const Footer = styled.footer`
  text-align: center;
  margin-top: 30px;
  padding: 15px;
  color: #999;
  font-size: 14px;
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Nav>
          <Logo>SSE & WebSocket 演示</Logo>
          <NavLinks>
            <StyledLink to="/">首页</StyledLink>
            <StyledLink to="/simple">简单SSE</StyledLink>
            <StyledLink to="/chat">聊天SSE</StyledLink>
            <StyledLink to="/websocket">WebSocket</StyledLink>
          </NavLinks>
        </Nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simple" element={<SimpleSSE />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/websocket" element={<WebSocketDemo />} />
        </Routes>

        <Footer>
          SSE & WebSocket Demo - 2025
        </Footer>
      </AppContainer>
    </Router>
  )
}

export default App
