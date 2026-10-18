interface Navigator {
  bluetooth?: { requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>; };
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinel>; };
}
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: EventListener): void;
}
