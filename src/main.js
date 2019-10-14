import './style/site.css'
import {graphOpt_} from './js/chart.js' // eslint-disable-line
import {setGoogleMapApi} from './js/gmap_chart'
import GoogleMapAPI from './js/map'
import secret from './credentials/secret'
import devsLocation from './data/devices.json'

const echarts = require('echarts');
const loadGoogleMapsApi = require('load-google-maps-api')


// step1: create an echart instance
var myChart = echarts.init(document.getElementById('main')); // eslint-disable-line

// use configuration item and data specified to show chart
myChart.setOption({
  backgroundColor: '#404a59',
  series: []
});
myChart.on('click', function(params) { // eslint-disable-line
  let opt = myChart.getOption();
  opt = {...opt};
  myChart.setOption(opt);
})


console.log(devsLocation);


// load Google Map
loadGoogleMapsApi({key: secret.google_map_key, libraries: ['drawing']}).then(function (googleMaps) {
  setGoogleMapApi(googleMaps);
  let map = new googleMaps.Map(document.querySelector('#map'), { //eslint-disable-line
    center: {
      lat: 40.7484405,
      lng: -73.9944191
    },
    zoom: 3,
    gestureHandling: 'greedy'
  });

  //TODO: Design this class later
  new GoogleMapAPI(map);
}).catch(function (error) {
  console.error(error)
})