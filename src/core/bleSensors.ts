export interface BleSensorData {
  heartRate?: number;
  cadence?: number;
  speedKmh?: number;
}

export class BleSensorManager {
  private hrDevice: BluetoothDevice | null = null;
  private cscDevice: BluetoothDevice | null = null;
  private listeners: ((data: BleSensorData) => void)[] = [];

  constructor(private wheelMm = 2105) {}

  public onData(fn: (data: BleSensorData) => void): void {
    this.listeners.push(fn);
  }

  private emit(data: BleSensorData): void {
    this.listeners.forEach(l => l(data));
  }

  public async connectHeartRate(): Promise<string> {
    if (!navigator.bluetooth) throw new Error('Bluetooth未対応ブラウザです');
    this.hrDevice = await navigator.bluetooth.requestDevice({ filters: [{ services: [0x180d] }] });
    const server = await this.hrDevice.gatt?.connect();
    const service = await server?.getPrimaryService(0x180d);
    const char = await service?.getCharacteristic(0x2a37);
    await char?.startNotifications();
    char?.addEventListener('characteristicvaluechanged', (e: any) => {
      const v = e.target.value as DataView;
      const hr = (v.getUint8(0) & 0x01) ? v.getUint16(1, true) : v.getUint8(1);
      this.emit({ heartRate: hr });
    });
    return this.hrDevice.name || 'Heart Rate';
  }

  public async connectSpeedCadence(): Promise<string> {
    if (!navigator.bluetooth) throw new Error('Bluetooth未対応ブラウザです');
    this.cscDevice = await navigator.bluetooth.requestDevice({ filters: [{ services: [0x1816] }] });
    const server = await this.cscDevice.gatt?.connect();
    const service = await server?.getPrimaryService(0x1816);
    const char = await service?.getCharacteristic(0x2a5b);
    await char?.startNotifications();

    let prevCrankRev: number | null = null;
    let prevCrankTime: number | null = null;

    char?.addEventListener('characteristicvaluechanged', (e: any) => {
      const v = e.target.value as DataView;
      const flags = v.getUint8(0);
      let offset = 1;
      if (flags & 0x01) offset += 6;
      if (flags & 0x02) {
        const rev = v.getUint16(offset, true);
        const time = v.getUint16(offset + 2, true);
        if (prevCrankRev !== null && prevCrankTime !== null) {
          const dRev = rev >= prevCrankRev ? rev - prevCrankRev : 0xffff - prevCrankRev + rev + 1;
          const dTime = time >= prevCrankTime ? time - prevCrankTime : 0xffff - prevCrankTime + time + 1;
          if (dTime > 0) this.emit({ cadence: Math.round(dRev / ((dTime / 1024) / 60)) });
        }
        prevCrankRev = rev;
        prevCrankTime = time;
      }
    });
    return this.cscDevice.name || 'Speed/Cadence';
  }
}
