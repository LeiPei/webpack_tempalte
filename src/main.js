import './style/site.css'
import printMe from './js/print.js'
import secret from './credentials/secret.js'

const echarts = require('echarts');
const loadGoogleMapsApi = require('load-google-maps-api');

var myChart = echarts.init(document.getElementById('main'));
// specify chart configuration item and data
var option = {
  title: {
    text: 'ECharts entry example'
  },
  tooltip: {},
  legend: {
    data: ['Sales']
  },
  xAxis: {
    data: ["shirt", "cardign", "chiffon shirt", "pants", "heels", "socks"]
  },
  yAxis: {},
  series: [{
    name: 'Sales',
    type: 'bar',
    data: [5, 20, 36, 10, 10, 20]
  }]
};

// use configuration item and data specified to show chart
myChart.setOption(option);


// load Google Map
loadGoogleMapsApi({key: secret.google_map_key}).then(function (googleMaps) {
  //  google.maps == googleMaps
  let map = new googleMaps.Map(document.querySelector('#map'), {
    center: {
      lat: 40.7484405,
      lng: -73.9944191
    },
    zoom: 12
  })
}).catch(function (error) {
  console.error(error)
})

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8
  });
}