import './styles.css';
import { BackgroundKeepAlive } from './core/keepAlive';
import { GeoKalmanFilter } from './core/geoFilter';
import { ClimbEngine, RoutePoint, ClimbSegment } from './core/climbEngine';
import { NavigationStateMachine, CuePoint } from './core/navState';
import { BleSensorManager } from './core/bleSensors';
import { RideRecorder } from './core/rideRecorder';
import { MapViewController } from './ui/mapView';
import { ImportModal } from './ui/importModal';
import { FinishModal } from './ui/finishModal';

const initialPoints: RoutePoint[] = Array.from({ length: 200 }, (_, i) => ({
  lat: 35.6812 + i * 0.0005,
  lng: 139.7671 + i * 0.0005,
  ele: 20 + Math.sin(i / 10) * 80 + (i > 80 && i < 140 ? (i - 80) * 3 : 0),
  distFromStart: i * 50
}));

const initialCues: CuePoint[] = [
  { distFromStart: 1200, action: 'right', text: '本町交差点を右折' },
  { distFromStart: 3500, action: 'left', text: '県道入口を左方向' }
];

class BikeApp {
  private keepAlive = new BackgroundKeepAlive();
  private filter = new GeoKalmanFilter();
  private ble = new BleSensorManager(2105);
  private recorder = new RideRecorder();
  private navState = new NavigationStateMachine(initialCues);
  private climbs: ClimbSegment[] = [];
  private mapView = new MapViewController();
  private importModal!: ImportModal;
  private finishModal = new FinishModal();
  private isRiding = false;
  private isMapMode = false;
  private currentDist = 0;
  private currentSpeed = 0;
  private currentGrade = 0;
  private bleCadence = 0;
  private bleHeartRate = 0;

  constructor() {
    this.climbs = ClimbEngine.extractClimbs(initialPoints);
    this.renderDOM();
    this.mapView.init('map-container', [139.7671, 35.6812]);
    this.mapView.setRoute(initialPoints);
    this.initBLE();
    this.importModal = new ImportModal(route => {
      this.climbs = ClimbEngine.extractClimbs(route.points);
      this.navState = new NavigationStateMachine(route.cues);
      this.mapView.setRoute(route.points);
      document.getElementById('tbt-text')!.innerText = route.name;
    });
    this.bindEvents();
  }

  private renderDOM() {
    document.getElementById('app')!.innerHTML = `
      <div class="relative h-screen w-screen bg-black text-white flex flex-col justify-between p-3 overflow-hidden">
        <div id="map-container" class="hidden"></div>
        <div class="relative z-10 flex flex-col justify-between h-full pointer-events-none">
          <header class="bg-zinc-950/90 border border-zinc-800 rounded-3xl p-4 flex items-center justify-between backdrop-blur pointer-events-auto">
            <div class="flex items-center space-x-3">
              <div id="tbt-icon" class="text-cyan-400 text-5xl font-black">➔</div>
              <div>
                <div id="tbt-dist" class="text-4xl font-black text-white">---<span class="text-lg text-zinc-400 ml-1">m</span></div>
                <div id="tbt-text" class="text-xs text-zinc-400 font-bold truncate max-w-[150px]">コース待機中</div>
              </div>
            </div>
            <div class="flex flex-col space-y-1 items-end">
              <div class="flex space-x-1">
                <button id="btn-ble-csc" class="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-[9px] font-bold">SPD/CAD</button>
                <button id="btn-ble-hr" class="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-[9px] font-bold">HRM</button>
              </div>
              <button id="btn-toggle-map" class="px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-lg text-[10px] font-bold">MAP切替</button>
            </div>
          </header>

          <div id="climb-card" class="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 my-auto pointer-events-auto">
            <div class="flex justify-between items-center mb-1">
              <span class="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Climb Profile</span>
              <span id="climb-grade-badge" class="px-2 py-0.5 rounded text-xs font-black bg-emerald-500 text-black">0.0%</span>
            </div>
            <div class="h-20 w-full flex items-end gap-1 bg-zinc-900/80 p-1 rounded-lg overflow-hidden" id="grade-bars"></div>
            <div class="flex justify-between text-xs text-zinc-400 mt-2 font-mono">
              <span>残: <b id="climb-rem-dist" class="text-white">--</b> km</span>
              <span>獲得: <b id="climb-rem-gain" class="text-white">--</b> m</span>
            </div>
          </div>

          <div class="pointer-events-auto space-y-2">
            <footer class="grid grid-cols-5 gap-1.5 bg-zinc-950/90 rounded-3xl p-2.5 border border-zinc-800">
              <div class="text-center col-span-2 bg-black/60 rounded-2xl py-1">
                <div class="text-[9px] text-zinc-400 font-black">SPEED</div>
                <div id="val-speed" class="text-4xl font-black font-mono text-cyan-300">0.0</div>
                <div class="text-[8px] text-zinc-500">km/h</div>
              </div>
              <div class="text-center bg-black/60 rounded-2xl py-1">
                <div class="text-[9px] text-zinc-400 font-black">CAD</div>
                <div id="val-cad" class="text-2xl font-black font-mono text-emerald-400 mt-1">0</div>
                <div class="text-[8px] text-zinc-500">rpm</div>
              </div>
              <div class="text-center bg-black/60 rounded-2xl py-1">
                <div class="text-[9px] text-zinc-400 font-black">HR</div>
                <div id="val-hr" class="text-2xl font-black font-mono text-rose-400 mt-1">--</div>
                <div class="text-[8px] text-zinc-500">bpm</div>
              </div>
              <div class="text-center bg-black/60 rounded-2xl py-1">
                <div class="text-[9px] text-zinc-400 font-black">GRADE</div>
                <div id="val-grade" class="text-2xl font-black font-mono text-white mt-1">0%</div>
                <div class="text-[8px] text-zinc-500">斜度</div>
              </div>
            </footer>
            <div class="flex gap-2">
              <button id="btn-open-import" class="w-1/3 py-3.5 bg-zinc-900 border border-zinc-700 text-white font-black text-sm rounded-2xl">インポート</button>
              <button id="btn-start" class="w-2/3 py-3.5 bg-cyan-400 text-black font-black text-base rounded-2xl">RIDE START</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  private initBLE() {
    this.ble.onData(data => {
      if (data.speedKmh !== undefined) this.currentSpeed = data.speedKmh;
      if (data.cadence !== undefined) this.bleCadence = data.cadence;
      if (data.heartRate !== undefined) this.bleHeartRate = data.heartRate;
      this.updateUI();
    });
  }

  private bindEvents() {
    document.getElementById('btn-toggle-map')!.addEventListener('click', () => {
      this.isMapMode = !this.isMapMode;
      document.getElementById('map-container')!.classList.toggle('hidden', !this.isMapMode);
      document.getElementById('climb-card')!.classList.toggle('opacity-0', this.isMapMode);
    });
    document.getElementById('btn-ble-csc')!.addEventListener('click', () => this.ble.connectSpeedCadence());
    document.getElementById('btn-ble-hr')!.addEventListener('click', () => this.ble.connectHeartRate());
    document.getElementById('btn-open-import')!.addEventListener('click', () => this.importModal.show());

    const btnStart = document.getElementById('btn-start')!;
    btnStart.addEventListener('click', () => {
      if (!this.isRiding) {
        this.isRiding = true;
        this.keepAlive.start();
        this.recorder.start();
        if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {});
        btnStart.innerText = 'FINISH RIDE';
        btnStart.className = 'w-2/3 py-3.5 bg-rose-500 text-white font-black text-base rounded-2xl';
        setInterval(() => {
          if (!this.isRiding) return;
          this.currentDist += this.currentSpeed / 3.6;
          const { nextCue, distToTurn } = this.navState.update(this.currentDist, this.currentSpeed / 3.6);
          if (nextCue) {
            document.getElementById('tbt-dist')!.innerHTML = `${Math.round(distToTurn)}<span class="text-lg text-zinc-400 ml-1">m</span>`;
            document.getElementById('tbt-text')!.innerText = nextCue.text;
          }
          this.updateUI();
        }, 1000);
      } else {
        this.isRiding = false;
        this.keepAlive.stop();
        const data = this.recorder.stop();
        this.finishModal.show(data, this.currentDist, (Date.now() - this.recorder.getStartTime()) / 1000);
        btnStart.innerText = 'RIDE START';
        btnStart.className = 'w-2/3 py-3.5 bg-cyan-400 text-black font-black text-base rounded-2xl';
      }
    });
  }

  private updateUI() {
    document.getElementById('val-speed')!.innerText = this.currentSpeed.toFixed(1);
    document.getElementById('val-cad')!.innerText = this.bleCadence.toString();
    document.getElementById('val-grade')!.innerText = `${Math.round(this.currentGrade)}%`;
    if (this.bleHeartRate > 0) document.getElementById('val-hr')!.innerText = this.bleHeartRate.toString();
  }
}

new BikeApp();
