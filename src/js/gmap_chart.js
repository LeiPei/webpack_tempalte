const echarts = require("echarts"); //eslint-disable-line

let googleMaps = null;
let Overlay;
let overlay = null; //eslint-disable-line
let hasProjectionChanged = false;
let mapInstance = null;
let mapRoot = null;
let mapOffset = [0, 0];

var _COMMON_GOOGLE_MAP_STYLE = [
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.business",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "stylers": [
      {
        "visibility": "simplified"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "stylers": [
      {
        "visibility": "simplified"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road.local",
    "stylers": [
      {
        "visibility": "simplified"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  }
];


class GMapCoordSys {
  constructor(gmap, api, overlay) {
    this._gmap = gmap; // google map instance
    this.dimensions = ['lng', 'lat'];
    this._mapOffset = [0, 0];

    this._api = api;
    this._overlay = overlay;
  }

  static create(ecModel, api) {
    let gmapCoordSys;
    let root = api.getDom();
  
    ecModel.eachComponent('gmap', function (gmapModel) {
      var viewportRoot = api.getZr().painter.getViewportRoot();
      Overlay = Overlay || createOverlayCtor();
      if (gmapCoordSys) {
        throw new Error('Only one gmap component can exist');
      }
      var gmap = gmapModel.getGMap(); // google map instance
      if (!gmap) {
        var gmapRoot = root.querySelector('.ec-extension-gmap');
        if (gmapRoot) {
          viewportRoot.style.left = '0px';
          viewportRoot.style.top = '0px';
          root.removeChild(gmapRoot);
        }
        gmapRoot = document.createElement('div'); //eslint-disable-line
        gmapRoot.style.cssText = 'width:100%;height:100%';
  
        gmapRoot.classList.add('ec-extension-gmap');
        root.appendChild(gmapRoot);
        // now create google map instance
        gmap = new googleMaps.Map(gmapRoot, {
          streetViewControl: true,
          minZoom: null,
          mapTypeControl: true,
          gestureHandling: 'greedy',
          styles: _COMMON_GOOGLE_MAP_STYLE
        });
        gmapModel.setGMap(gmap);
        overlay = new Overlay(viewportRoot, api);
        overlay.setMap(gmap);
        gmap.addListener('center_changed', function() {
         console.log('center change!');
        });
      }
  
      var center = gmapModel.get('center');
      if (typeof center !== 'undefined') {
        var point = new googleMaps.LatLng(center[1], center[0]);
        gmap.setCenter(point);
      }
  
      var zoom = gmapModel.get('zoom');
      if (typeof zoom !== 'undefined') {
        gmap.setZoom(zoom);
      }
  
      gmapCoordSys = new GMapCoordSys(gmap, api, overlay);
      gmapCoordSys.setMapOffset(gmapModel.getMapOffset());
      if (!hasProjectionChanged) {
          googleMaps.event.addListenerOnce(gmap, "projection_changed", function () {
              gmapCoordSys.setZoom(zoom);
              gmapCoordSys.setCenter(center);
              hasProjectionChanged = true;
          });
      } else {
          gmapCoordSys.setZoom(zoom);
          gmapCoordSys.setCenter(center);
      }
  
      gmapModel.coordinateSystem = gmapCoordSys;
    });
  
    ecModel.eachSeries(function (seriesModel) {
      if (seriesModel.get('coordinateSystem') === 'gmap') {
        seriesModel.coordinateSystem = gmapCoordSys;
      }
    });
  }

  setZoom(zoom) {
    this._zoom = zoom;
  }

  setCenter(center) {
    let projection = this._gmap.getProjection();
    this._center = projection.fromLatLngToPoint(new googleMaps.LatLng(center[1], center[0]));
  }

  setMapOffset(mapOffset) {
    this._mapOffset = mapOffset;
  }

  getGMap() {
    return this._gmap;
  }

  dataToPoint(data) {
    let point = new googleMaps.LatLng(data[1], data[0]);
    let projection = this._overlay.getProjection();
    let px = projection.fromLatLngToContainerPixel(point);
    return [px.x, px.y];
  }

  pointToData(pt){
    let projection = this._overlay.getProjection();
    let mapOffset = this._mapOffset;
    pt = projection.fromDivPixelToLatLng({
        x: pt[0] + mapOffset[0],
        y: pt[1] + mapOffset[1]
    });
    return [pt.lng, pt.lat];
  }
  getViewRect() {
    let api = this._api;
    return new echarts.graphic.BoundingRect(0, 0, api.getWidth(), api.getHeight());
  }
  getRoamTransform() {
    return echarts.matrix.create();
  }
  prepareCustoms() {
    return echarts.matrix.create();
  }
}

GMapCoordSys.dimensions = ['lng', 'lat'];

function createOverlayCtor() {
  function Overlay(root, api) {
    this._root = root; //dom element rendering E-chart (right below map-canvas)
    this._api = api;
  }

  Overlay.prototype = new googleMaps.OverlayView();

  // set option will be safe after this is called
  Overlay.prototype.onAdd = function () {
    this.getPanes().floatPane.appendChild(this._root);
    let offsetEl = this._root.parentElement.parentElement.parentElement;
    this._root.style.top = offsetEl.offsetHeight / 2 * -1 + 'px';
    this._root.style.left = offsetEl.offsetWidth / 2 * -1 + 'px';
    this._api.dispatchAction({
        type: 'gMapReady'
    });
  };

  Overlay.prototype.onRemove = function () {
    this._root.parentNode.removeChild(this._root);
    this._root = null;
    this._api = null;
  };

  Overlay.prototype.draw = function () {
    console.log('draw');
    var transformStyle = this._root.parentNode.parentNode.style.transform.replace('translate(', '').replace(')', '');
    var dx = 0;
    var dy = 0;
    if (transformStyle) {
      var parts = transformStyle.split(',');
      dx = -parseInt(parts[parts.length - 2], 10);
      dy = -parseInt(parts[parts.length - 1], 10);
    } else { // browsers that don't support transform: matrix
      dx = -parseInt(offsetEl.style.left, 10);
      dy = -parseInt(offsetEl.style.top, 10);
    }
    var offsetEl = this._root.parentElement.parentElement.parentElement;
    var baseOffset = [-1 * offsetEl.offsetWidth / 2, -1*offsetEl.offsetHeight / 2]; // center on the screen
    if (dx == 0 && dy == 0) {
      this._root.style.left = baseOffset[0] + 'px';
      this._root.style.top = baseOffset[1] + 'px';

    } else {
      this._root.style.left = baseOffset[0] + dx + 'px';
      this._root.style.top = baseOffset[1] + dy + 'px';
    }
    mapOffset = [dx, dy];
    // this will make Cord be created again, which then set center and then draw again ... infinite loop
    this._api.dispatchAction({
      type: 'gMapRoam'
    });
  };

  return Overlay;
}

function v2Equal(a, b) {
  return a && b && a[0] === b[0] && a[1] === b[1];
}

echarts.extendComponentModel({

  type: 'gmap',

  getGMap: function () {
      return mapInstance;
  },

  setGMap: function (gmap) {
      mapInstance = gmap;
  },

  getGMapRoot: function () {
      return mapRoot;
  },

  setGMapRoot: function (gMapRoot) {
      mapRoot = gMapRoot;
  },

  getMapOffset: function () {
      return mapOffset;
  },

  setMapOffset: function (offset) {
      mapOffset = offset;
  },

  setCenterAndZoom: function (center, zoom) {
      this.option.center = center;
      this.option.zoom = zoom;
  },

  centerOrZoomChanged: function (center, zoom) {
      var option = this.option;
      return !(v2Equal(center, option.center) && zoom === option.zoom);
  },

  defaultOption: {
      center: [-20, 30],
      zoom: 2,
      mapStyle: {}
  }
});

echarts.extendComponentView({
  type: 'gmap',

  render: function (gMapModel) {
      var MAX_ZOOM = 16;

      var gmap = gMapModel.getGMap();

      var originalStyle = gMapModel.__mapStyle;

      var newMapStyle = gMapModel.get('mapStyle') || {};
      // FIXME, Not use JSON methods
      var mapStyleStr = JSON.stringify(newMapStyle);
      if (JSON.stringify(originalStyle) !== mapStyleStr) {
          if (Object.keys(newMapStyle).length) {
              gmap.setOptions({
                  styles: newMapStyle
              });
          }
          gMapModel.__mapStyle = JSON.parse(mapStyleStr);
      }

      // if bounds has been specified use fitBounds to show a specific area of the map
      // MAX_ZOOM is used to prevent map from showing only a point with a huge zoom value
      if (typeof (gMapModel.__bounds) === 'undefined' && gMapModel.get('bounds')) {
          googleMaps.event.addListenerOnce(gmap, 'bounds_changed', function () {
              if (gmap.getZoom() > MAX_ZOOM) {
                  gmap.setZoom(MAX_ZOOM);
              }
          });
          gmap.fitBounds(gMapModel.get('bounds'));
      }
  },

  dispose: function () {}
});

/**
 * GMap component extension
 */

echarts.registerCoordinateSystem('gmap', GMapCoordSys);

echarts.registerAction({
  type: 'gMapRoam',
  event: 'gMapRoam',
  update: 'updateLayout'
}, function (payload, ecModel) {
    ecModel.eachComponent('gmap', function (gMapModel) {
      var gmap = gMapModel.getGMap();
      var center = gmap.getCenter();
      gMapModel.setCenterAndZoom([center.lng(), center.lat()], gmap.getZoom());
    });
});

echarts.registerAction({
  type: 'gMapReady',
  event: 'gMapReady',
  update: 'updateLayout'
}, function (payload, ecModel) {
    ecModel.eachComponent('gmap', function (gMapModel) {
      var gmap = gMapModel.getGMap();
      var center = gmap.getCenter();
      gMapModel.setCenterAndZoom([center.lng(), center.lat()], gmap.getZoom());
    });
});

export function setGoogleMapApi(lib) {
  googleMaps = lib;
}

