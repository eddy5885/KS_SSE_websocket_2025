const axios = require("../libs/axios");
const crypto = require("crypto");

const aiToken = "2IEmcPrMnP734kzk0YmSNh87FHNCVjQf";
const wps_uid = 9036;
const product_name = "wps_aigctest_campusexam";
const intention_code = "saas_training_exam";
const AI_HOST_URL = "ai-gateway.wps.cn";

function generateActionId() {
  return crypto.randomBytes(16).toString("hex");
}
const dev = "development";
//非流式响应
async function Chat(ctx) {
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.set("Access-Control-Allow-Methods", "POST");

  let { prompt = "" } = ctx.request.body;
  prompt = prompt.trim();

  if (!prompt) {
    throw { code: -1, message: "prompt为空" };
  }
  const ret = {
    code: 0,
    data: {},
  };
  const headers = {
    Authorization: "Bearer " + aiToken,
    "AI-Gateway-Uid": wps_uid,
    "AI-Gateway-Product-Name": product_name,
    "AI-Gateway-Intention-Code": intention_code,
    "X-Action-Id": generateActionId(),
    "Content-Type": "application/json",
  };

  const options = {};
  options.headers = headers;
  if (dev === "development") {
    options.proxy = {
      protocol: "http",
      host: "127.0.0.1",
      port: 8899,
    };
  }
  const res = await axios.post(
    "http://" + AI_HOST_URL + "/api/v2/llm/chat",
    {
      stream: false,
      messages: [
        {
          content: prompt,
          role: "user", //枚举值需要固定
        },
      ],

      provider: "azure", //模型厂商
      model: "gpt-4", // 对应官网的model
      version: "turbo-2024-04-09", // model的版本，非必填
      base_llm_arguments: {
        temperature: 0.7,
        top_p: 1,
        top_k: 1,
      },
      retry_strategy: {
        retry_count: 1,
        timeout: 60,
      },
    },
    options
  );
  if (res.code === "Success") {
    ret.data = res?.choices[0]?.text;
  } else {
    ret.code = -1;
  }

  // 返回结果
  ctx.body = ret;
}


// 流式响应处理
async function ChatStream(ctx) {
  ctx.set("Access-Control-Allow-Origin", "*");
  ctx.set("Access-Control-Allow-Methods", "POST");

  let { prompt = "" } = ctx.request.body;
  prompt = prompt.trim();

  if (!prompt) {
    ctx.status = 400;
    ctx.body = { code: -1, message: "prompt为空" };
    return;
  }
  
  // 配置响应为SSE格式
  ctx.set("Content-Type", "text/event-stream");
  ctx.set("Cache-Control", "no-cache");
  ctx.set("Connection", "keep-alive");
  
  // 设置成功状态码
  ctx.status = 200;
  
  // 启动响应流
  const sseStream = ctx.res;
  
  try {
    const headers = {
      Authorization: "Bearer " + aiToken,
      "AI-Gateway-Uid": wps_uid,
      "AI-Gateway-Product-Name": product_name,
      "AI-Gateway-Intention-Code": intention_code,
      "X-Action-Id": generateActionId(),
      "Content-Type": "application/json",
    };

    const options = {
      headers,
      responseType: 'stream', // 重要：设置响应类型为流
      onDownloadProgress: (event) => {
        // 可选：处理下载进度
      }
    };
    
    if (dev === "development") {
      options.proxy = {
        protocol: "http",
        host: "127.0.0.1",
        port: 8899,
      };
    }
    
    // 发送流式请求
    const response = await axios.post(
      "http://" + AI_HOST_URL + "/api/v2/llm/chat",
      {
        stream: true,
        messages: [
          {
            content: prompt,
            role: "user",
          },
        ],
        provider: "azure",
        model: "gpt-4",
        version: "turbo-2024-04-09",
        base_llm_arguments: {
          temperature: 0.7,
          top_p: 1,
          top_k: 1,
        },
        retry_strategy: {
          retry_count: 1,
          timeout: 60,
        },
      },
      options
    );

    // 处理流式响应
    await processStreamResponse(response, sseStream);

  } catch (error) {
    console.error('调用API时发生错误:', error);
    // 发送错误事件到SSE流
    try {
      sseStream.write(`event: error\n`);
      sseStream.write(`data: ${JSON.stringify({ message: '服务器错误', error: error.message })}\n\n`);
      sseStream.end();
    } catch (streamError) {
      console.error('写入错误流时出错:', streamError);
    }
  }
}

// 处理流式响应（优化版）
async function processStreamResponse(axiosResponse, outputStream) {
  let fullResponse = '';
  let isDone = false;
  
  // 发送开始事件
  outputStream.write(`event: start\n`);
  outputStream.write(`data: ${JSON.stringify({ message: '开始接收响应' })}\n\n`);
  
  // 监听响应流数据
  return new Promise((resolve, reject) => {
    axiosResponse
      .on('data', (chunk) => {
        try {
          // 解码二进制数据为文本
          const text = chunk.toString('utf-8');
          // 按行分割SSE数据
          const lines = text.split('\n');
          
          lines.forEach(line => {
            if (line.trim() === '') return;
            
            // 处理SSE格式的响应块
            if (line.startsWith('data:')) {
              const data = line.substring('data:'.length).trim();
              
              // 检查是否为结束标记
              if (data === '[DONE]') {
                isDone = true;
                outputStream.write(`event: end\n`);
                outputStream.write(`data: ${JSON.stringify({ message: '响应完成' })}\n\n`);
                outputStream.end(); // 结束响应流
                resolve(fullResponse);
                return;
              }
              
              try {
                // 解析JSON数据
                const parsedData = JSON.parse(data);
                console.log('接收到数据:', parsedData);
                if (parsedData.choices && parsedData.choices[0]) {
                  const content = parsedData.choices[0].text;
                  if (content) {
                    console.log(content); // 输出模型生成的内容
                    fullResponse += content;
                    // 发送到客户端，使用标准SSE格式
                    outputStream.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                  }
                }
                
                // 处理usage信息（如果有）
                if (parsedData.usage) {
                  console.log('Token用量统计:', parsedData.usage);
                }
              } catch (parseError) {
                console.warn('解析响应块时出错:', parseError.message, data);
                // 发送错误事件到客户端
                outputStream.write(`event: error\n`);
                outputStream.write(`data: ${JSON.stringify({ message: parseError.message })}\n\n`);
              }
            }
          });
        } catch (error) {
          console.error('处理流数据时出错:', error);
          outputStream.write(`event: error\n`);
          outputStream.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
          reject(error);
        }
      })
      .on('end', () => {
        if (!isDone) {
          console.log('响应流已结束');
          outputStream.write(`event: end\n`);
          outputStream.write(`data: ${JSON.stringify({ message: '响应完成' })}\n\n`);
          outputStream.end();
        }
        resolve(fullResponse);
      })
      .on('error', (error) => {
        console.error('响应流错误:', error);
        outputStream.write(`event: error\n`);
        outputStream.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
        outputStream.end();
        reject(error);
      });
  });
}
module.exports = {
  Chat,
  ChatStream
};
