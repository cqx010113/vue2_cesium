import axios from "axios";

// 创建 axios 实例
const requests = axios.create({
  // 这里我没有设置basURL，我是在vue.config.js 中的 devServer中的 host:localhost 上访问的
  // 如果要打包部署的话，用nginx 代理好一个端口，再进行接口的调整
  // baseURL: process.env.VUE_APP_API, // 基础url,如果是多环境配置这样写，也可以像下面一行的写死。
  // baseURL: 'http://168.192.0.123’,
  // 如果设置了代理，那你本地开发环境的axios的baseUrl要写为''，即空字符串
  baseURL: "",
  timeout: 6000, // 请求超时时间
});

// request interceptor(请求拦截器)
requests.interceptors.request.use((config) => {
  // 实际使用时，设置的token 验证
  // const token = localStorage.getItem('token');
  // if (token) {
    // config.headers['token'] = token; // 让每个请求携带自定义 token 请根据实际情况自行修改
  // }
  return config;
}, err);

// response interceptor（接收响应拦截器）
requests.interceptors.response.use((response) => {
  // debugger
  const res = response.data;
  if (res.code !== 0 && res.code !== 200) {
    this.$notify.error({
      title: "错误",
      message: res.message || res.msg,
    });
    // 401:未登录;
    if (res.code === 401 || res.code === 403) {
      this.$notify.error({
        title: "错误",
        message: "请登录",
      });
    }
    return Promise.reject("error");
  } else {
    return res;
  }
}, err);

// 错误处理函数
const err = (error) => {
  if (error.response) {
    const data = error.response.data;
    if (error.response.status === 403) {
      this.$notify.error({
        title: "错误",
        message: data.message || data.msg,
      });
    }
    if (error.response.status === 401) {
      this.$notify.error({
        title: "错误",
        message: "你没有权限。",
      });
      // if (token) {
      //   store.dispatch('Logout').then(() => {
      //     setTimeout(() => {
      //       window.location.reload()
      //     }, 1500);
      //   });
      // }
    }
  }
  return Promise.reject(error);
};

export default requests;
// 这里的提示消息 实际看你选用哪个UI框架
// 比如你使用 vant框架，可以用 Notify
// 这里面的 Notify 指的是前端vant框架里面的弹框组件，这里你可以按你自己的实际需求来决定选择提示框
// 比如你使用 element-ui框架，可以用 notify
// 本次 http.js 中用到的就是 element-ui框架的notify