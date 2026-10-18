export class FinishModal {
  private el: HTMLElement;
  private fitData: Uint8Array | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 hidden';
    this.el.innerHTML = `<div class="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-3xl p-6 text-white text-center">
      <h2 class="text-2xl font-black text-cyan-400 mb-2">RIDE COMPLETED</h2>
      <p class="text-xs text-zinc-400 mb-6">走行ログが記録されました</p>
      <button id="btn-dl-fit" class="w-full py-4 bg-cyan-400 text-black font-black rounded-2xl active:scale-95">💾 .FIT を保存</button>
      <button id="btn-close-modal" class="w-full py-3 mt-2 text-zinc-500 font-bold text-sm">閉じる</button>
    </div>`;
    document.body.appendChild(this.el);

    this.el.querySelector('#btn-close-modal')!.addEventListener('click', () => this.el.classList.add('hidden'));
    this.el.querySelector('#btn-dl-fit')!.addEventListener('click', () => {
      if (!this.fitData) return;
      const blob = new Blob([this.fitData], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.download = `Ride_${Date.now()}.fit`;
      a.href = URL.createObjectURL(blob);
      a.click();
    });
  }

  public show(data: Uint8Array, dist: number, sec: number): void {
    this.fitData = data;
    this.el.classList.remove('hidden');
  }
}
