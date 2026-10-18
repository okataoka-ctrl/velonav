export interface FitRecordPoint {
  timestamp: number;
  lat?: number;
  lng?: number;
  ele?: number;
  speedMps?: number;
  distanceMeters?: number;
  heartRate?: number;
  cadence?: number;
}

export class FitEncoder {
  public static encodeActivity(records: FitRecordPoint[]): Uint8Array {
    const buffer = new ArrayBuffer(records.length * 40 + 256);
    const view = new DataView(buffer);
    view.setUint8(0, 14); view.setUint8(1, 0x20); view.setUint16(2, 2114, true);
    view.setUint32(4, records.length * 20, true);
    view.setUint8(8, 0x2e); view.setUint8(9, 0x46); view.setUint8(10, 0x49); view.setUint8(11, 0x54);
    view.setUint16(12, 0, true);
    return new Uint8Array(buffer, 0, 64);
  }
}
