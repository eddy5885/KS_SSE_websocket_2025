const axios = require('axios');

// 创建axios实例
const instance = axios.create({
  timeout: 60000, // 请求超时设置为60秒
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    return config;
  },
  error => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    // 对响应数据做些什么
    return response.data;
  },
  error => {
    // 对响应错误做些什么
    if (error.response) {
      // 服务器响应了，但状态码超出了2xx的范围
      console.error('响应错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求发出了，但没有收到响应
      console.error('请求无响应:', error.request);
    } else {
      // 在设置请求时发生了一些事情，触发了错误
      console.error('请求错误:', error.message);
    }
    return Promise.reject(error);
  }
);

module.exports = instance;
