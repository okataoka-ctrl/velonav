import { ParsedRoute } from './gpxParser';
import { RoutePoint } from './climbEngine';
import { CuePoint } from './navState';

export class RouteImporter {
  public static async importFromUrl(url: string): Promise<ParsedRoute> {
    const match = url.trim().match(/ridewithgps\.com\/routes\/(\d+)/);
    if (!match) throw new Error('現在は Ride with GPS のルートURLに対応しています');
    const res = await fetch(`https://ridewithgps.com/routes/${match[1]}.json`);
    if (!res.ok) throw new Error('ルート取得に失敗しました');
    const data = await res.json();
    const trip = data.trip || data;
    const points: RoutePoint[] = (trip.track_points || []).map((p: any) => ({
      lat: p.y, lng: p.x, ele: p.e || 0, distFromStart: p.d || 0
    }));
    const cues: CuePoint[] = (trip.course_points || []).map((cp: any) => ({
      distFromStart: cp.d,
      action: (cp.t || '').toLowerCase().includes('left') ? 'left' : (cp.t || '').toLowerCase().includes('right') ? 'right' : 'straight',
      text: cp.n || cp.d_desc || '分岐'
    }));
    return {
      name: trip.name || 'RWGPS Route',
      points, cues, totalDistance: trip.distance || 0, totalElevationGain: trip.elevation_gain || 0
    };
  }
}
