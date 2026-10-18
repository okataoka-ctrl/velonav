import { FitEncoder, FitRecordPoint } from './fitEncoder';

export class RideRecorder {
  private records: FitRecordPoint[] = [];
  private startTime = 0;

  public start(): void {
    this.records = [];
    this.startTime = Date.now();
  }

  public addPoint(p: Omit<FitRecordPoint, 'timestamp'>): void {
    this.records.push({ timestamp: Date.now(), ...p });
  }

  public stop(): Uint8Array {
    return FitEncoder.encodeActivity(this.records);
  }

  public getStartTime(): number {
    return this.startTime;
  }
}
