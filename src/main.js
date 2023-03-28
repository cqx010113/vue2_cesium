import Vue from 'vue';
import { Notification, Button } from 'element-ui';
import App from './App.vue';
import router from './router';
import store from './store';
// 引入 echarts
import echarts from './libs/echarts';
// 引入封装的axios
import apiMethods from './libs/apis';
import jquery from './libs/jquery';

// 引用自定义样式
import '@/styles/index.scss';

import 'element-ui/lib/theme-chalk/index.css';

Vue.prototype.$notify = Notification;
// 使用处理好的axios
Vue.prototype.$apiMethods = apiMethods;
Vue.config.productionTip = false;
Vue.use(jquery);
Vue.use(echarts);
Vue.use(Button);
new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
