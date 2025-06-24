require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const router = require('./routes');

const app = new Koa();
const port = process.env.PORT || 3000;

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const status = err.status || 500;
    const message = err.message || '服务器内部错误';
    
    ctx.status = status;
    ctx.body = {
      code: err.code || -1,
      message: message
    };
    
    // 记录错误日志
    console.error(`错误: ${status} - ${message}`, err);
  }
});

// 使用中间件
app.use(cors());
app.use(bodyParser());

// 使用路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动静态文件服务
const serve = require('koa-static');
const http = require('http');
const path = require('path');
const fs = require('fs');
const initWebSocketServer = require('./utils/websocket');

// 检查React客户端构建目录是否存在，如果存在则优先提供React应用
const reactBuildPath = path.join(__dirname,'../', 'client', 'dist');


// 提供传统静态资源（用于开发模式或作为后备方案）
app.use(serve(reactBuildPath));

// 处理路由
app.use(async (ctx, next) => {
  // 检查是否为API或WebSocket请求
  if (ctx.path.startsWith('/api') || ctx.path === '/ws') {
    return await next();
  }
  
  // 检查React客户端构建目录是否存在
  // const reactBuildPath = path.join(__dirname,'../', 'client', 'dist');
  // if (fs.existsSync(reactBuildPath)) {
  //   // 对于所有非API和非静态资源的请求，返回React的index.html（支持客户端路由）
  //   const isStaticAsset = ctx.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico)$/);
  //   if (!isStaticAsset) {
  //     ctx.type = 'html';
  //     ctx.body = fs.createReadStream(path.join(reactBuildPath, 'index.html'));
  //     return;
  //   }
  // } else if (ctx.path === '/') {
  //   // 如果React构建不存在，则回退到传统HTML页面
  //   ctx.redirect('/home.html');
  //   return;
  // }
  
  await next();
});

// 创建HTTP服务器实例，而不是直接使用app.listen
const server = http.createServer(app.callback());

// 初始化WebSocket服务器
const wss = initWebSocketServer(server);

// 启动HTTP服务器
server.listen(port, () => {
  console.log(`服务启动成功，监听端口: ${port}`);
  console.log(`HTTP请访问: http://localhost:${port}`);
  console.log(`WebSocket请连接: ws://localhost:${port}`);
});
