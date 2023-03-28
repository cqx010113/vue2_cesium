import requests from "./http";
// import qs from "qs";

const getChartData = () => {
  return requests({
    url: "/DemoData/charList.json",
    method: "get",
  });
};

const apiMethods = {
  // 具体调用的方法名称
  getChartData,
  // 其他的详细接口，可以接着往下写
  // ...
};

// 直接导出整个api对象，需要用哪个detailMethod，就 apiMethods.detailMethod
export default apiMethods;
