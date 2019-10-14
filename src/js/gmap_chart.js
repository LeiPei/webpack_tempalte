const echarts = require("echarts"); //eslint-disable-line

let googleMaps = null;
let Overlay;
let overlay = null;
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

    this.create = (ecModel, api) => {
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
  prepareCustoms() {}
}

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
    this._api.dispatchAction({
      type: 'gMapRoam'
    });
  };

  return Overlay;
}

console.log(GMapCoordSys)

/**
 * GMap component extension
 */
// echarts.registerCoordinateSystem('bmap', GMapCoordSys); // Action

export function setGoogleMapApi(lib) {
  googleMaps = lib;
}

