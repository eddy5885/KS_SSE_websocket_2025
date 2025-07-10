const { setCache, getCache } = require('../utils/fileCache');
const axios = require('../libs/axios');

async function callAI(ctx) {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'POST');

  const { uuid } = ctx.request.query;
  let { prompt = '' } = ctx.request.body;
  prompt = prompt.trim();
  console.log('uuid', uuid);
  
  if (!prompt) {
    throw { code: -1, message: 'prompt为空' };
  }
  
  const responseData = {
    code: 200,
    data: `您输入的内容是：${prompt}。这是一个非流式响应示例。`,
    msg: 'success',
    timeStart: Date.now(),
    timeEnd: Date.now() + 500,
    timeSpend: 500
  };
  
  // 返回结果
  ctx.body = responseData;
}

async function getHeader(ctx) {
  const headers = ctx.request.headers;
  console.log('headers', headers);

  ctx.body = {
    code: 0,
    data: headers,
  };
}

// SSE流式响应接口 - 简单示例
async function sendSSE(ctx) {
  // 设置状态码为200
  ctx.status = 200;
  ctx.set('Content-Type', 'text/event-stream');
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');
  ctx.set('Access-Control-Allow-Origin', '*');

  const { uuid } = ctx.request.query;
  let { prompt = '' } = ctx.request.body;
  prompt = prompt.trim();
  
  if (!prompt) {
    ctx.status = 400;
    ctx.body = 'event: error\ndata: prompt为空\n\n';
    return;
  }
  
  // 获取响应流
  const stream = ctx.res;
  
  try {
    // 发送开始事件
    stream.write('event: start\ndata: 开始响应\n\n');
    
    // 准备模拟数据 - 这里可以根据prompt生成不同的响应
    let responseData;
    
    if (prompt.includes('天气')) {
      responseData = '今天天气晴朗，温度25°C，微风，适合户外活动。明天可能有小雨，建议携带雨具。后天转晴，气温回升到28°C。';
    } else if (prompt.includes('时间') || prompt.includes('日期')) {
      const now = new Date();
      responseData = `现在是北京时间：${now.toLocaleString('zh-CN')}，今天是${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日。`;
    } else if (prompt.includes('列表') || prompt.includes('清单')) {
      responseData = '以下是待办事项清单：\n1. 完成项目报告\n2. 安排团队会议\n3. 准备演示文稿\n4. 联系客户确认需求\n5. 更新项目进度表\n6. 审核代码提交';
    } else {
      responseData = `您的输入是：${prompt}\n\n这是一个模拟的长文本响应，演示SSE的渐进式显示效果。Server-Sent Events (SSE) 是一种允许服务器向客户端推送数据的技术。与WebSocket不同，SSE是单向的，只能从服务器发送到客户端。SSE非常适合需要服务器实时推送数据到浏览器的场景，比如股票价格更新、社交媒体通知、新闻提醒等。`;
    }
    
    // 模拟字符一个个发送的效果
    const chars = responseData.split('');
    
    // 逐字符发送
    for (let i = 0; i < chars.length; i++) {
      // 随机延迟，模拟打字效果
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
      
      // 发送当前字符
      stream.write(`data: ${JSON.stringify({ text: chars[i] })}\n\n`);
    }
    
    // 发送结束事件
    stream.write('event: end\ndata: 响应结束\n\n');
    
  } catch (error) {
    console.error('SSE错误:', error);
    stream.write(`event: error\ndata: ${JSON.stringify({ message: '服务器错误' })}\n\n`);
  } finally {
    ctx.respond = false; // 防止Koa自动发送响应
    ctx.res.end();
  }
}

module.exports = {
  callAI,
  getHeader,
  sendSSE
};
