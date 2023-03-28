<template>
  <div style="width: 532px;">
    <div class="header">
      <div class="title">{{ pointInfo.title }}</div>
      <div class="dateTime">{{ dateTime }}</div>
    </div>
    <div class="pop-tab">
      <div :class="{ 'tab': true, 'checked': item.checked }" v-for="(item) in choseList" :key="item.code"
        @click="choseType(item)">
        {{ item.label }}
      </div>
    </div>
    <div class="factorUnitText">单位：{{ curChosedUnit }}</div>

    <div v-show="isChartHaveData" style="width: 435px; height: 170px;">
      <Echart ref="FactorChart" :options="echartObj" :autoResize="true" style="width: 435px; height: 170px;" />
    </div>
    <div v-show="!isChartHaveData"
      style="width: 445px;height: 170px;color:#909399;text-align: center;line-height: 170px;">暂无数据</div>
  </div>
</template>
<script>
export default {
  props: {
    pointInfo: {
      type: Object, // 要传的值的类型
      default() {
        return {
          pointId: "--",
          title: "--",
        };
      },
    },
  },
  data() {
    return {
      // tab 列表
      choseList: [
        { code: "SO2", label: "SO2", unit: "μg/m3", checked: true },
        { code: "NO2", label: "NO2", unit: "μg/m3", checked: false },
        { code: "PM10", label: "PM10", unit: "μg/m3", checked: false },
        { code: "CO", label: "CO", unit: "μg/m3", checked: false },
        { code: "O38", label: "O3-8", unit: "μg/m3", checked: false },
        { code: "PM25", label: "PM2.5", unit: "μg/m3", checked: false },
      ],
      // 默认选中的项
      curChosed: "SO2", // 当前选中因子编码
      curChosedLabel: "SO2", // 当前选中因子名称
      curChosedUnit: "μg/m3", // 当前选中因子单位
      echartObj: {}, // 图表对象
      dateTime: "--", // 传的时间
      lineChartData: [], // 接口返回的图表数据
      upperValue: "", // 上限值
      isChartHaveData: false, // false 图表无数据 true 图表有数据
    };
  },
  methods: {
    choseType(item) {
      // 清空上一次的图表
      this.echartObj = {};
      this.choseList.forEach((element) => {
        element.checked = false;
      });
      item.checked = true;
      this.curChosed = item.code;
      this.curChosedLabel = item.label;
      this.curChosedUnit = item.unit;
      this.loadEcharts();
    },
    loadEcharts() {
      this.dateTime = "";
      this.isChartHaveData = false;

      // 调用 具体的方法
      this.$apiMethods
        .getChartData(this.pointInfo.pointId, this.curChosed)
        .then((res) => {
          console.log(res.data.data);
          if (res.data != null) {
            this.dateTime = res.data.tstamp;
            this.upperValue = res.data.upperValue;
            if (res.data.data != null && res.data.data.length > 0) {
              this.isChartHaveData = true;
              this.lineChartData = res.data.data;
              this.drawChart();
            } else {
              this.isChartHaveData = false;
            }
          } else {
            this.isChartHaveData = false;
          }
        })
        .catch(() => {
          setTimeout(() => {
            this.isChartHaveData = false;
          }, 8000);
        });
    },
    drawChart() {
      const XData = []; // 横坐标数据
      const YData = []; // 纵坐标数据
      const limitData = []; // 限值数据

      this.lineChartData.forEach((item) => {
        XData.push(item.tstamp);
        YData.push(item.factorValue);
        limitData.push(this.upperValue);
      });

      const seriesData = [
        {
          name: this.curChosedLabel,
          type: "line",
          smooth: true,
          stack: "总量",
          data: YData,
          areaStyle: {},
          itemStyle: {
            normal: {
              lineStyle: {
                width: 3, // 折线宽度
                color: "rgba(252, 254, 0, 1)",
              },
            },
          },
        }
      ];

      if (this.upperValue != null && this.upperValue != "") {
        seriesData.push({
          name: "标准限值",
          type: "line",
          showSymbol: false,
          data: limitData,
          lineStyle: {
            normal: {
              width: 1,
              color: "#e74143", // 这儿设置安全基线颜色
              type: "dashed",
            },
          },
        });
      }

      this.echartObj = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
            label: {
              backgroundColor: "#6a7985",
            },
          },
        },
        grid: {
          top: "6%",
          left: "6%",
          right: "6%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: XData,
          axisLine: { // x轴线的颜色以及宽度
            show: true,
            lineStyle: {
              color: "white",
              width: 1,
              type: "solid",
            },
          },
          axisLabel: {
            show: true,
            textStyle: {
              color: "white",
            },
            // 坐标轴刻度标签的相关设置。
            formatter(params) {
              let newParamsName = ""; // 最终拼接成的字符串
              const paramsNameNumber = params.length; // 实际标签的个数
              const provideNumber = 10; // 每行能显示的字的个数
              const rowNumber = Math.ceil(paramsNameNumber / provideNumber); // 换行的话，需要显示几行，向上取整
              /**
               * 判断标签的个数是否大于规定的个数， 如果大于，则进行换行处理 如果不大于，即等于或小于，就返回原标签
               */
              // 条件等同于rowNumber>1
              if (paramsNameNumber > provideNumber) {
                /** 循环每一行,p表示行 */
                // eslint-disable-next-line no-plusplus
                for (let p = 0; p < rowNumber; p++) {
                  let tempStr = ""; // 表示每一次截取的字符串
                  const start = p * provideNumber; // 开始截取的位置
                  const end = start + provideNumber; // 结束截取的位置
                  // 此处特殊处理最后一行的索引值
                  if (p === rowNumber - 1) {
                    // 最后一次不换行
                    tempStr = params.substring(start, paramsNameNumber);
                  } else {
                    // 每一次拼接字符串并换行
                    tempStr = `${params.substring(start, end)}\n`;
                  }
                  newParamsName += tempStr; // 最终拼成的字符串
                }
              } else {
                // 将旧标签的值赋给新标签
                newParamsName = params;
              }
              // 将最终的字符串返回
              return newParamsName;
            },
          },
        },
        yAxis: {
          type: "value",
          axisTick: false,
          axisLabel: {
            show: true,
            textStyle: {
              color: "white",
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: ["#777"],
              opacity: 0.3,
              width: 1,
              type: "solid",
            },
          },
          axisLine: { // y轴线的颜色以及宽度
            show: false,
            lineStyle: {
              color: "#9dcbfb",
              width: 1,
              type: "solid",
            },
          },
        },
        itemStyle: { // 面积图颜色设置
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(252, 254, 0, 1)", // 0% 处的颜色
              },
              {
                offset: 1,
                color: "rgba(252, 254, 0, 0.1)", // 100% 处的颜色
              },
            ],
            globalCoord: false, // 缺省为 false
          },
        },
        series: seriesData,
      };
    },
    clearEcharts() {
      this.$refs.FactorChart.dispose(); // 组件销毁时清除定时器
    },
    // 因为弹框组件是一直放在cesiumMap.vue中，没有使用v-if，所以它是一直就存在的，所以我们想让弹框一打开，就调用mounted()钩子，调用加载loadEcharts方法，是没有用的
    // 因此，我们这边要做一个弹框每次打开就会调用的方法
    defalutSetting() {
      // 恢复默认设置
      this.choseList.forEach((element) => {
        element.checked = false;
        if (element.code == "SO2") {
          element.checked = true;
          this.curChosed = "SO2";
          this.curChosedLabel = "SO2";
          this.unit = "μg/m3";
        }
      });
      this.loadEcharts();
    },
  },
  mounted() { },
};
</script>

<style lang="scss" scoped>
.header {
  position: relative;
  margin-bottom: 15px;

  .title {
    display: inline-block;
    color: #19ffff;
    font-weight: 700;
    font-size: 18px;
  }

  .dateTime {
    color: #00de00;
    transform: skew(-20deg);
    font-size: 21px;
    padding-left: 10px;
    padding-right: 10px;
    position: absolute;
    right: 75px;
    top: 0px;
  }
}

.pop-tab {
  .tab {
    display: inline-block;
    width: 60px;
    height: 40px;
    background-color: transparent;
    cursor: pointer;
    text-align: center;
    line-height: 40px;
  }

  .checked {
    background-color: #00a2ff;
    border-radius: 7px;
  }
}

.factorUnitText {
  color: white;
  width: 100px;
  padding: 5px 0px 0px 10px;
}</style>