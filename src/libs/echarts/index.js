import echarts from 'echarts';
import Echart from 'vue-echarts';

export default(Vue) => {
  Vue.prototype.$echarts = echarts;
  Vue.component('Echart', Echart);
};
