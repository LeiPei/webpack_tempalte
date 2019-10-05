import './style/site.css'
import {graphOpt_} from './js/chart.js'
import GoogleMapAPI from './js/map'
import secret from './credentials/secret'
import devsLocation from './data/devices.json'

const echarts = require('echarts');
const loadGoogleMapsApi = require('load-google-maps-api')

var myChart = echarts.init(document.getElementById('main')); // eslint-disable-line

// use configuration item and data specified to show chart
myChart.setOption(graphOpt_);
myChart.on('click', function(params) { // eslint-disable-line
  let opt = myChart.getOption();
  opt = {...opt};
  myChart.setOption(opt);
})


console.log(devsLocation);


// load Google Map
loadGoogleMapsApi({key: secret.google_map_key, libraries: ['drawing']}).then(function (googleMaps) {
  //  google.maps == googleMaps
  let map = new googleMaps.Map(document.querySelector('#map'), { //eslint-disable-line
    center: {
      lat: 40.7484405,
      lng: -73.9944191
    },
    zoom: 3,
    gestureHandling: 'greedy'
  });

  var flightPlanCoordinates = [
    {lat: 37.772, lng: -122.214},
    {lat: 21.291, lng: -157.821},
    {lat: -18.142, lng: 178.431},
    {lat: -27.467, lng: 153.027}
  ];
  var flightPath = new googleMaps.Polyline({
    path: flightPlanCoordinates,
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 2
  });

  flightPath.setMap(map);

  //TODO: Design this class later
  new GoogleMapAPI(map);
}).catch(function (error) {
  console.error(error)
})