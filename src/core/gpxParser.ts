import { RoutePoint } from './climbEngine';
import { CuePoint } from './navState';

export interface ParsedRoute {
  name: string;
  points: RoutePoint[];
  cues: CuePoint[];
  totalDistance: number;
  totalElevationGain: number;
}

export class GpxParser {
  public static parse(xml: string): ParsedRoute {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const name = doc.querySelector('name')?.textContent || 'GPX Route';
    const trkpts = Array.from(doc.querySelectorAll('trkpt'));
    const points: RoutePoint[] = [];
    let dist = 0, gain = 0;

    for (let i = 0; i < trkpts.length; i++) {
      const lat = parseFloat(trkpts[i].getAttribute('lat') || '0');
      const lng = parseFloat(trkpts[i].getAttribute('lon') || '0');
      const ele = parseFloat(trkpts[i].querySelector('ele')?.textContent || '0');

      if (i > 0) {
        const d = this.haversine(points[i - 1].lat, points[i - 1].lng, lat, lng);
        dist += d;
        const diff = ele - points[i - 1].ele;
        if (diff > 0) gain += diff;
      }
      points.push({ lat, lng, ele, distFromStart: dist });
    }
    return { name, points, cues: [], totalDistance: dist, totalElevationGain: gain };
  }

  private static haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
