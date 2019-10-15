import './style/site.css'
import {graphOpt_} from './js/chart.js' // eslint-disable-line
import {setGoogleMapApi} from './js/gmap_chart'
// import {EMAP_STYLE} from './constant/echart_map_style'
import GoogleMapAPI from './js/map' //eslint-disable-line
import secret from './credentials/secret'
// import devsLocation from './data/devices.json'

const echarts = require('echarts');
const loadGoogleMapsApi = require('load-google-maps-api');
const $ = require("jquery");
const ROOT_PATH = 'https://echarts.apache.org/examples/'


// step1: create an echart instance
var myChart = echarts.init(document.getElementById('main')); // eslint-disable-line

myChart.on('click', function(params) { // eslint-disable-line
  let opt = myChart.getOption();
  opt = {...opt};
  myChart.setOption(opt);
})
  


// load Google Map
loadGoogleMapsApi({key: secret.google_map_key, libraries: ['drawing']}).then(function (googleMaps) {
  setGoogleMapApi(googleMaps);
  // let map = new googleMaps.Map(document.querySelector('#map'), { //eslint-disable-line
  //   center: {
  //     lat: 40.7484405,
  //     lng: -73.9944191
  //   },
  //   zoom: 3,
  //   gestureHandling: 'greedy'
  // });

  // use configuration item and data specified to show chart
  myChart.setOption({
    backgroundColor: '#404a59',
    gmap: {
      // a simplistic style to make google maps style changing appear progressive
      center: [120.13066322374, 30.240018034923],
      zoom: 14,
      roam: true,
      silent: true,
      // mapStyle: EMAP_STYLE
    },
    series: []
  });

  myChart.on('gMapReady', function () {
    $.get(ROOT_PATH + 'data/asset/data/hangzhou-tracks.json', function (data) {
      let lines = data.map(function (track) {
        return {
          coords: track.map(function (seg) {
            return seg.coord;
          })
        };
      });
      console.log(lines);
      // myChart.setOption({
      //   series: [{
      //     type: 'lines',
      //     coordinateSystem: 'gmap',
      //     data: lines,
      //     polyline: true,
      //     lineStyle: {
      //       normal: {
      //         color: 'purple',
      //         opacity: 0.6,
      //         width: 1
      //       }
      //     }
      //   }]
      // });
    });
  });

  //TODO: Design this class later
  // new GoogleMapAPI(map);
}).catch(function (error) {
  console.error(error)
})