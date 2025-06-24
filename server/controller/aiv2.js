const axios = require("../libs/axios");
const crypto = require("crypto");

const aiToken = "hP8jkofGDzGJdQJyNITNzu8q2oDuoG4d";
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

module.exports = {
  Chat,
};
