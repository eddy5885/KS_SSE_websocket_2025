# SSE打字效果演示

这是一个使用Server-Sent Events (SSE) 技术实现打字效果的演示项目。项目包含了简单示例页面和聊天界面两种演示方式。

## 功能特点

- 后端使用Koa.js框架
- 前端实现实时打字效果
- 使用SSE技术实现服务器向客户端的实时推送
- 模拟不同类型的响应（天气、日期时间、列表等）
- 友好的用户界面，支持按Enter快速发送消息

## 什么是SSE?

Server-Sent Events (SSE) 是一种允许服务器向客户端推送数据的HTTP技术。与WebSocket不同，SSE是单向的，只能从服务器发送到客户端，但实现更加简单。SSE特别适合于需要服务器实时推送数据的场景，如：

- 实时通知和消息推送
- 数据更新（如股票价格变动）
- 状态更新
- 像本项目一样的打字效果

## 安装与运行

1. 克隆项目

2. 安装依赖
```bash
cd SSE
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
```
然后编辑`.env`文件，设置端口等配置信息。

4. 启动服务器
```bash
npm start
```
或者使用开发模式（自动重启）:
```bash
npm run dev
```

5. 访问应用
浏览器打开 http://localhost:3000

## 演示页面说明

1. **主页 (/)**: 项目入口，提供所有演示页面的链接
2. **简单演示 (/simple.html)**: 一个简洁的示例，展示SSE的基本用法和打字效果，包含预设的响应模式
3. **聊天界面 (/index.html)**: 一个模仿聊天应用的界面，使用SSE实现消息的打字效果

## 项目结构

```
.
├── app.js              # 应用入口文件
├── controller/         # 控制器
│   └── ai.js           # SSE接口控制器
├── libs/               # 公共库
│   └── axios.js        # Axios请求库配置
├── logs/               # 日志目录
├── public/             # 静态资源
│   ├── home.html       # 首页
│   ├── simple.html     # 简单SSE演示页面
│   ├── index.html      # 聊天界面页面
│   └── js/             # JavaScript文件
│       └── chat.js     # 聊天功能脚本
├── routes/             # 路由
│   └── index.js        # 路由配置
└── utils/              # 工具函数
    └── fileCache.js    # 文件缓存工具
```

## API接口

- POST `/api/sse` - SSE流式响应接口
  - 参数：`prompt` (用户输入文本)，`uuid` (可选，用于标识会话)
  - 响应：根据输入内容返回不同的文本，逐字符发送
- POST `/api/ai` - 常规非流式响应接口
- GET `/api/health` - 健康检查接口

## 技术实现

### 前端技术

前端使用`fetch API`和`ReadableStream`处理流数据：

```javascript
// 使用fetch创建POST请求的SSE连接
fetch('/api/sse', {
    method: 'POST',
    body: JSON.stringify({ prompt })
}).then(response => {
    const reader = response.body.getReader();
    
    // 处理流数据
    function readStream() {
        return reader.read().then(({ done, value }) => {
            // 处理接收到的数据...
        });
    }
});
```

### 后端技术

后端使用Koa.js创建SSE流，逐字符发送响应：

```javascript
// 设置SSE所需的响应头
ctx.set('Content-Type', 'text/event-stream');
ctx.set('Cache-Control', 'no-cache');
ctx.set('Connection', 'keep-alive');

// 发送开始事件
stream.write('event: start\ndata: 开始响应\n\n');

// 逐字符发送数据
for (let i = 0; i < chars.length; i++) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
    stream.write(`data: ${JSON.stringify({ text: chars[i] })}\n\n`);
}

// 发送结束事件
stream.write('event: end\ndata: 响应结束\n\n');
```

## 扩展建议

1. 接入真实AI API，实现实际的对话功能
2. 添加更多的交互效果，如打字声音、动画等
3. 实现完整的聊天历史记录和多轮对话
4. 添加更多的消息类型，如图片、链接等
5. 优化移动端体验

## 许可证

MIT
