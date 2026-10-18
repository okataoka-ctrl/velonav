export interface RoutePoint {
  lat: number;
  lng: number;
  ele: number;
  distFromStart: number;
}

export interface ClimbSegment {
  id: number;
  name: string;
  startDist: number;
  endDist: number;
  length: number;
  startEle: number;
  endEle: number;
  eleGain: number;
  avgGrade: number;
  maxGrade: number;
  points: { dist: number; ele: number; grade: number }[];
}

export class ClimbEngine {
  public static extractClimbs(points: RoutePoint[]): ClimbSegment[] {
    const climbs: ClimbSegment[] = [];
    if (points.length < 2) return climbs;

    const smoothed = points.map((p, i) => {
      let sum = 0, cnt = 0;
      for (let j = 0; j < points.length; j++) {
        if (Math.abs(points[j].distFromStart - p.distFromStart) <= 50) {
          sum += points[j].ele;
          cnt++;
        }
      }
      return cnt > 0 ? sum / cnt : p.ele;
    });

    let inClimb = false;
    let startIdx = 0;

    for (let i = 1; i < points.length; i++) {
      const run = points[i].distFromStart - points[startIdx].distFromStart;
      const rise = smoothed[i] - smoothed[startIdx];
      const grade = run > 0 ? (rise / run) * 100 : 0;

      if (!inClimb) {
        if (grade >= 3.0 && run >= 100) inClimb = true;
        else if (grade < 1.0) startIdx = i;
      } else {
        const d = points[i].distFromStart - points[i - 1].distFromStart;
        const recentG = d > 0 ? ((smoothed[i] - smoothed[i - 1]) / d) * 100 : 0;

        if (recentG < -1.5 || i === points.length - 1) {
          const len = points[i].distFromStart - points[startIdx].distFromStart;
          const gain = smoothed[i] - smoothed[startIdx];
          if (len >= 500 && (gain / len) * 100 >= 3.0) {
            climbs.push({
              id: climbs.length + 1,
              name: `Climb ${climbs.length + 1}`,
              startDist: points[startIdx].distFromStart,
              endDist: points[i].distFromStart,
              length: len,
              startEle: smoothed[startIdx],
              endEle: smoothed[i],
              eleGain: gain,
              avgGrade: (gain / len) * 100,
              maxGrade: 12.0,
              points: [{ dist: points[startIdx].distFromStart, ele: smoothed[startIdx], grade: 3 }]
            });
          }
          inClimb = false;
          startIdx = i;
        }
      }
    }
    return climbs;
  }

  public static getGradeColor(grade: number): string {
    if (grade < 3) return '#10B981';
    if (grade < 6) return '#FBBF24';
    if (grade < 9) return '#F97316';
    if (grade < 12) return '#EF4444';
    return '#8B5CF6';
  }
}
