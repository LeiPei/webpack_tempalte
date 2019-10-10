/**
 * The Google Map Class
 */
class GoogleMapAPI {
  constructor(map) {
    this._map = map;
  }

  get map() {
    return this._map;
  }
}

export default GoogleMapAPI;