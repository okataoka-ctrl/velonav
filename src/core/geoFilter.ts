export interface GeoPoint {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export class GeoKalmanFilter {
  private variance = -1;
  private lat = 0;
  private lng = 0;
  private readonly Q = 3.0;

  public filter(point: GeoPoint): { lat: number; lng: number } {
    if (this.variance < 0) {
      this.lat = point.lat;
      this.lng = point.lng;
      this.variance = point.accuracy * point.accuracy;
      return { lat: this.lat, lng: this.lng };
    }
    this.variance += this.Q * this.Q;
    const k = this.variance / (this.variance + point.accuracy * point.accuracy);
    this.lat += k * (point.lat - this.lat);
    this.lng += k * (point.lng - this.lng);
    this.variance = (1 - k) * this.variance;
    return { lat: this.lat, lng: this.lng };
  }
}
