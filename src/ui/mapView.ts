import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RoutePoint } from '../core/climbEngine';

export class MapViewController {
  private map: maplibregl.Map | null = null;
  private marker: maplibregl.Marker | null = null;

  public init(id: string, center: [number, number]): void {
    this.map = new maplibregl.Map({
      container: id,
      style: {
        version: 8,
        sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256 } },
        layers: [{ id: 'osm', type: 'raster', source: 'osm', paint: { 'raster-brightness-max': 0.6, 'raster-saturation': -0.8 } }]
      },
      center,
      zoom: 15,
      attributionControl: false
    });
    const el = document.createElement('div');
    el.className = 'w-5 h-5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_10px_#22d3ee]';
    this.marker = new maplibregl.Marker({ element: el }).setLngLat(center).addTo(this.map);
  }

  public setRoute(pts: RoutePoint[]): void {
    if (!this.map) return;
    this.map.on('load', () => {
      this.map!.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: pts.map(p => [p.lng, p.lat]) }
        }
      });
      this.map!.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: { 'line-color': '#06b6d4', 'line-width': 6 }
      });
    });
  }

  public updatePosition(lng: number, lat: number, heading: number | null): void {
    if (!this.map || !this.marker) return;
    this.marker.setLngLat([lng, lat]);
    if (heading !== null) this.map.easeTo({ center: [lng, lat], bearing: heading, duration: 800 });
    else this.map.easeTo({ center: [lng, lat], duration: 800 });
  }
}
