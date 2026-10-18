export class BackgroundKeepAlive {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isRunning = false;

  public start(): void {
    if (this.isRunning) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    this.oscillator = this.audioCtx.createOscillator();
    this.gainNode = this.audioCtx.createGain();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(40, this.audioCtx.currentTime);
    this.gainNode.gain.setValueAtTime(0.00001, this.audioCtx.currentTime);
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    this.oscillator.start();
    this.isRunning = true;
    setInterval(() => {
      if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }, 10000);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.oscillator?.stop();
    this.audioCtx?.close();
    this.isRunning = false;
  }
}
