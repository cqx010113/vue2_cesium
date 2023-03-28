<template>
  <div>
    <div id="sceneViewer" class="scene-viewer"></div>
    <!-- 地图气泡弹框 -->
    <div class="dynamic-layer" id="one">
      <div class="line"></div>
      <div class="main">
        <cesiumPopup :pointInfo="popData" ref="popUp" />
        <div class="tooltip-arrow"></div>
      </div>
    </div>
    <el-button type="primary" style="position: fixed;top: 20px;left: 20px;" @click="showPointName">显示隐藏点位</el-button>
  </div>
</template>

<script>
import {
  Ion,
  Viewer,
  UrlTemplateImageryProvider,
  BoundingSphere,
  Cartesian3,
  Color,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  Math,
  CallbackProperty,
  defined,
  ImageMaterialProperty,
} from 'cesium/Cesium';

import cesiumPopup from './cesiumPopup.vue';

// 引用cesium style
require('cesium/Widgets/widgets.css');

export default {
  data() {
    return {
      viewer: undefined,
      pointEntities: [],
      pointEntitiesLine: [],
      pointInfo: [],
      popData: {
        title: null,
        pointId: null
      }
    };
  },
  components: {
    cesiumPopup,
  },
  methods: {
    init() {
      Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmYWQxM2ZmYi0wNzUzLTRiMjgtOWMwZi1iYmQxN2Y2NmY0ZWEiLCJpZCI6MTI5NjQ4LCJpYXQiOjE2NzkzOTE3NDB9.ZECqTvFjCixqza9k7id8usnLbl-JPE1PUku9ZeENW6A';
      this.viewer = new Viewer('sceneViewer', {
        baseLayerPicker: false, // 如果设置为false，将不会创建右上角图层按钮。
        selectionIndicator: false, // Cesium 关闭点击绿色框
        geocoder: false, // 如果设置为false，将不会创建右上角查询(放大镜)按钮。
        navigationHelpButton: false, // 如果设置为false，则不会创建右上角帮助(问号)按钮。
        homeButton: false, // 如果设置为false，将不会创建右上角主页(房子)按钮。
        sceneModePicker: false, // 如果设置为false，将不会创建右上角投影方式控件(显示二三维切换按钮)。
        animation: false, // 如果设置为false，将不会创建左下角动画小部件。
        timeline: false, // 如果设置为false，则不会创建正下方时间轴小部件。
        fullscreenButton: false, // 如果设置为false，将不会创建右下角全屏按钮。
        scene3DOnly: true, // 为 true 时，每个几何实例将仅以3D渲染以节省GPU内存。
        shouldAnimate: false, // 默认true ，否则为 false 。此选项优先于设置 Viewer＃clockViewModel 。
        // ps. Viewer＃clockViewModel 是用于控制当前时间的时钟视图模型。我们这里用不到时钟，就把shouldAnimate设为false
        infoBox: false, // 是否显示点击要素之后显示的信息
        sceneMode: 3, // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode
        requestRenderMode: false, // 启用请求渲染模式，不需要渲染，节约资源吧
        fullscreenElement: document.body, // 全屏时渲染的HTML元素 暂时没发现用处，虽然我关闭了全屏按钮，但是键盘按F11 浏览器也还是会进入全屏
        // 使用高德影像地形地图
        imageryProvider: new UrlTemplateImageryProvider({
          url: 'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        }),
      });
      // 再加上高德影像注记地图
      this.viewer.imageryLayers.addImageryProvider(
        new UrlTemplateImageryProvider({
          url: 'http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8',
        }),
      );
      // 设置初始位置  Cesium.Cartesian3.fromDegrees(longitude, latitude, height, ellipsoid, result)
      const boundingSphere = new BoundingSphere(
        Cartesian3.fromDegrees(120.55538, 31.87532, 100),
        15000,
      );
      // 定位到初始位置
      this.viewer.camera.flyToBoundingSphere(boundingSphere, {
        // 定位到初始位置的过渡时间，设置成0，就没有过渡，类似一个过场的动画时长
        duration: 0,
      });
      // 监听地图点击事件
      const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
      // 单击事件
      handler.setInputAction((click) => {
        console.log(click.position);
        // 屏幕坐标转世界坐标
        const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
        // 将上面的笛卡尔坐标转为地理坐标
        const cartographic = Cartographic.fromCartesian(cartesian);
        // 将弧度转为度的十进制表示，保留5位小数
        const lon = Math.toDegrees(cartographic.longitude).toFixed(5);
        const lat = Math.toDegrees(cartographic.latitude).toFixed(5);
        console.log(lon, lat);
        // 获取地图上的点位实体(entity)坐标
        const pick = this.viewer.scene.pick(click.position);
        // 如果pick不是undefined，那么就是点到点位了
        if (pick && pick.id) {
          const cartographic2 = Cesium.Cartographic.fromCartesian(pick.id.position._value);
          const lon2 = Cesium.Math.toDegrees(cartographic2.longitude).toFixed(5);
          const lat2 = Cesium.Math.toDegrees(cartographic2.latitude).toFixed(5)
          // 定位到地图中心
          this.locationToCenter(lon2, lat2);
          console.log(pick.id);
          const data = {
            layerId: 'layer1', // 英文，且唯一,内部entity会用得到
            lon,
            lat,
            element: '#one', // 弹框的唯一id
            boxHeightMax: 0, // 中间立方体的最大高度
          };

          this.$('#one').css('z-index', 9990);
          this.showDynamicLayer(this.viewer, data, () => { // 回调函数 改变弹窗的内容;
            this.popData.title = pick.id.name;
            this.popData.pointId = pick.id.id;
          });
          // 调用弹框的默认方法
          this.$refs.popUp.defalutSetting();
          // 添加弹框特效(红色选中波纹特效)
          this.addCircleRippleInit(this.viewer, lon2, lat2, 1);
        } else {
          if (document.querySelector("#one")) {
            this.removeDynamicLayer(this.viewer, { element: '#one' });
            this.$('#one').css('z-index', -1);
          }
          // 移除波纹特效
          if (this.viewer.entities.getById("abcd-111")) {
            this.viewer.entities.remove(this.viewer.entities.getById("abcd-111"))
          }
          if (this.viewer.entities.getById("abcd-222")) {
            this.viewer.entities.remove(this.viewer.entities.getById("abcd-222"))
          }
        }
      }, ScreenSpaceEventType.LEFT_CLICK);
    },
    // 园扩散构造方法
    addCircleRipple(viewer, data) {
      var r1 = data.minR, r2 = data.minR
      // 移除上一次的波纹效果
      if (viewer.entities.getById(data.id[0])) {
        viewer.entities.remove(viewer.entities.getById(data.id[0]))
      }

      if (viewer.entities.getById(data.id[1])) {
        viewer.entities.remove(viewer.entities.getById(data.id[1]))
      }
      // 回调函数1
      function changeR1() { //这是callback，参数不能内传
        r1 = r1 + data.deviationR;
        if (r1 >= data.maxR) {
          r1 = data.minR;
        }
        return r1;
      }
      // 回调函数2
      function changeR2() {
        r2 = r2 + data.deviationR;
        if (r2 >= data.maxR) {
          r2 = data.minR;
        }
        return r2;
      }
      viewer.entities.add({
        id: data.id[0],
        name: '',
        position: Cartesian3.fromDegrees(data.lon, data.lat, data.height),
        ellipse: {
          semiMinorAxis: new CallbackProperty(changeR1, false),
          semiMajorAxis: new CallbackProperty(changeR2, false),
          height: data.height,
          material: new ImageMaterialProperty({
            image: data.imageUrl,
            repeat: new Cartesian2(1.0, 1.0),
            transparent: true,
            color: new CallbackProperty(function () {
              var alp = 1 - r1 / data.maxR;
              return Color.WHITE.withAlpha(alp)  //entity的颜色透明 并不影响材质，并且 entity也会透明哦
            }, false)
          })
        }
      })
      setTimeout(function () {
        viewer.entities.add({
          id: data.id[1],
          name: "",
          position: Cartesian3.fromDegrees(data.lon, data.lat, data.height),
          ellipse: {
            semiMinorAxis: new CallbackProperty(changeR1, false),
            semiMajorAxis: new CallbackProperty(changeR2, false),
            height: data.height,
            material: new ImageMaterialProperty({
              image: data.imageUrl,
              repeat: new Cartesian2(1.0, 1.0),
              transparent: true,
              color: new CallbackProperty(function () {
                var alp = 1;
                alp = 1 - r2 / data.maxR;
                return Color.WHITE.withAlpha(alp)
              }, false)
            })
          }
        });
      }, data.eachInterval);

    },
    addCircleRippleInit(viewer, long, lat, height) {
      let data = {
        id: ["abcd-111", "abcd-222"], // 2个实现圆弧效果的实体id，后面对这2个实体的操作都是通过这个id来的
        lon: long * 1, // 经度 就不多说了
        lat: lat * 1, // 维度 也不多说了
        height: height, // 因为是3d地图，地图上的实体会有高度属性，可以设置实体的高度
        maxR: 700, // 圆弧的最大半径
        minR: 0,  // 最好为0
        deviationR: 3,  // 差值 差值也大 速度越快
        eachInterval: 1000, // 两个圈的时间间隔
        imageUrl: require('@/assets/red_circle.png'),
      };
      console.log(data);
      // 调用上面构造圆弧的方法
      this.addCircleRipple(viewer, data);
    },
    loadPoints() {
      // 用模拟数据测试
      this.pointInfo = [
        {
          id: '392f7fbb-ae25-4eef-ac43-58fd91148d1f',
          latitude: '31.87532',
          longitude: '120.55538',
          psName: '有限公司1',
        },
        {
          id: '0278a88c-b4f4-4d64-9ccb-65831b3fb19d',
          latitude: '31.991057',
          longitude: '120.700713',
          psName: '有限公司2',
        },
        {
          id: '248f6853-2ced-4aa6-b679-ea6422a5f3ac',
          latitude: '31.94181',
          longitude: '120.51517',
          psName: '有限公司3',
        },
        {
          id: 'F8DADA95-A438-49E1-B263-63AE3BD7DAC4',
          latitude: '31.97416',
          longitude: '120.56132',
          psName: '有限公司4',
        },
        {
          id: '9402a911-78c5-466a-9162-d5b04d0e48f0',
          latitude: '31.91604',
          longitude: '120.57771',
          psName: '有限公司5',
        },
        {
          id: 'EB392DD3-6998-437F-8DCB-F805AD4DB340',
          latitude: '31.88727',
          longitude: '120.48887',
          psName: '有限公司6',
        },
      ];
      this.addMarker();
    },
    // cesium 加载点位
    addMarker() {
      this.viewer.entities.removeAll();
      this.pointEntities = []
      this.pointEntitiesLine = []
      // foreach循环加载点位
      this.pointInfo.forEach((pointObj) => {
        const pointEntity = this.viewer.entities.add({
          name: pointObj.psName,
          code: pointObj.id,
          id: pointObj.id,
          position: Cartesian3.fromDegrees(
            pointObj.longitude * 1,
            pointObj.latitude * 1,
            100
          ),
          // 点
          // point: {
          //   pixelSize: 5,
          //   color: Color.RED,
          //   outlineColor: Color.WHITE,
          //   outlineWidth: 2,
          // },
          label: {
            // show: false,
            text: pointObj.psName,
            font: '12px monospace',
            style: LabelStyle.FILL_AND_OUTLINE,
            // fillColor: Color.LIME,
            fillColor: Color.fromCssColorString('#67ADDF'),
            outlineWidth: 4,
            verticalOrigin: VerticalOrigin.BOTTOM, // 垂直方向以底部来计算标签的位置
            pixelOffset: new Cartesian2(0, -20), // 偏移量
          },
          // 图标
          billboard: {
            image: require('@/assets/定位.png'),
            width: 18,
            height: 24,
          },
        });
        // const labelEntityLine = this.loadFloatPoint(pointObj, pointObj.longitude * 1, pointObj.latitude * 1, 100);
        this.pointEntities.push(pointEntity)
        // 循环添加点位引线方法
        // this.pointEntitiesLine.push(labelEntityLine)
      });
    },
    // loadFloatPoint(pointObj, long, lat, height){
    //   const lineColor = '#108de7'
    //   const entityLine = this.viewer.entities.add({
    //     name: 'line_' + pointObj.pointName,
    //     code: 'line_' + pointObj.pointCode,
    //     id: 'line_' + pointObj.pointCode,
    //     // 经度维度必须是数字
    //     // position: Cesium.Cartesian3.fromDegrees(120.42602, 31.92423),
    //     polyline: {
    //       positions: Cartesian3.fromDegreesArrayHeights([
    //         long, lat, 0,
    //         long, lat, height,
    //       ]),
    //       width: 1,
    //       // 材质设置
    //       // material: Cesium.Color.DODGERBLUE,
    //       material: Color.fromCssColorString(lineColor),
    //       // material : new Cesium.PolylineGlowMaterialProperty({ //发光线
    //       //     glowPower : 0.1,
    //       //     color : Cesium.Color.DODGERBLUE
    //       // })
    //     },
    //   });
    //   return entityLine;
    // },
    //显示/隐藏点位
    showPointName() {
      if (this.pointEntities && this.pointEntities.length > 0) {
        // 如果当前点位的label是隐藏的，就让他显示
        if (this.pointEntities[0].label.show == false) {
          this.pointEntities.forEach((ele) => {
            ele.label.show = true;
          });
          return;
        }
        // 如果当前点位的label是显示的，否则就让点位隐藏
        this.pointEntities.forEach((ele) => {
          ele.label.show = false;
        });
      }
      return;
    },

    // 创建一个动态实体弹窗
    showDynamicLayer(viewer, data, callback) {
      this.$(data.element).css({ opacity: 0 }); // 使用hide()或者display是不行的 因为cesium是用pre定时重绘的div导致 left top display 会一直重绘
      this.$('.dynamic-layer .line').css({ width: 0 });
      this.$(data.element).find('.main').hide(0);
      callback();

      // 添加div弹窗
      const lon = data.lon * 1, lat = data.lat * 1;
      // data.boxHeightMax为undef也没事
      var divPosition = Cartesian3.fromDegrees(lon, lat, data.boxHeightMax);
      this.$('#one').css({ opacity: 1 });
      this.$('#one').find('.line').animate({
        width: 50, // 线的宽度
      }, 500, () => {
        this.$('#one').find('.main').fadeIn(500);
      });
      // 当为true的时候，表示当element在地球背面会自动隐藏。默认为false，置为false，不会这样。但至少减轻判断计算压力
      this.creatHtmlElement(viewer, data.element, divPosition, [10, -0], true);
    },

    // 创建一个 htmlElement元素 并且，其在earth背后会自动隐藏
    creatHtmlElement(viewer, element, position, arr, flog) {
      var ele = document.querySelector(element);
      var scratch = new Cartesian2(); // cesium二维笛卡尔 笛卡尔二维坐标系就是我们熟知的而二维坐标系；三维也如此
      var scene = viewer.scene, camera = viewer.camera;
      scene.preRender.addEventListener(() => {
        var canvasPosition = scene.cartesianToCanvasCoordinates(position, scratch); // cartesianToCanvasCoordinates 笛卡尔坐标（3维度）到画布坐标
        if (defined(canvasPosition)) {
          ele.style.left = (canvasPosition.x + arr[0] - 534 / 2 - 15 + 5) + "px";
          ele.style.top = (canvasPosition.y + arr[1] - 30 - 22) + "px";
          if (flog && flog === true) {
            var e = position, i = camera.position, n = scene.globe.ellipsoid.cartesianToCartographic(i).height
            if (!(n += 1 * scene.globe.ellipsoid.maximumRadius, Cartesian3.distance(i, e) > n)) {
              // $(element).show()
              ele.style.display = 'block';
            } else {
              ele.style.display = 'none';
            }
          }
        }
      });
    },

    // 移除动态弹窗 为了方便 这里的移除 是真的移除，因此 到时是需要重建弹窗的doom的
    removeDynamicLayer(viewer, data) {
      document.querySelector(data.element).style.opacity = 0;
    },
    // 点位定位到地图中心
    locationToCenter(lon, lat) {
      const pointLocation = new BoundingSphere(Cartesian3.fromDegrees(lon * 1, lat * 1, 100), 15000)
      this.viewer.camera.flyToBoundingSphere(pointLocation)
    }
  },
  mounted() {
    this.init();
    this.loadPoints();
  },
};
</script>

<style scoped lang="scss">
.scene-viewer {
  height: 100%;
}

.dynamic-layer {
  display: none;
  user-select: none;
  pointer-events: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 534px;
  // width: 100%; // 这里设置成100%，打算在组件内根据内容设置具体的宽度实践 发现无效
  z-index: 99990;
}

.dynamic-layer .line {
  position: absolute;
  left: 0;
  width: 0;
  /* height: 100px; */
  bottom: 0;
  /* background: url(./img/line.png); */
}

.dynamic-layer .main {
  display: none;
  position: absolute;
  top: 0;
  left: 30px;
  right: 0;
  /* bottom: 100px; */
  transform: translateY(-100%);
  background-size: 100% 100%;
  color: white;
  padding: 20px 20px 20px 20px;
  font-size: 14px;
  user-select: text;
  pointer-events: auto;
  background-color: rgba(3, 22, 37, .85);
}

.tooltip-arrow {
  position: absolute;
  left: 45%;
  bottom: -21px;
  width: 0;
  height: 0;
  border-top: 12px solid rgba(3, 22, 37, 0.85);
  border-right: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-left: 12px solid transparent;
}
</style>
