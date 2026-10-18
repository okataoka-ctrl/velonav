import { RouteImporter } from '../core/routeImporter';
import { ParsedRoute } from '../core/gpxParser';

export class ImportModal {
  private el: HTMLElement;

  constructor(private onLoaded: (r: ParsedRoute) => void) {
    this.el = document.createElement('div');
    this.el.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 hidden';
    this.el.innerHTML = `<div class="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-3xl p-6 text-white">
      <h3 class="text-lg font-bold mb-3">ルートをインポート</h3>
      <input id="modal-url" type="url" placeholder="Ride with GPS のURL" class="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white mb-4 focus:outline-none"/>
      <div class="flex gap-2">
        <button id="modal-cancel" class="w-1/3 py-3 bg-zinc-800 rounded-xl font-bold">キャンセル</button>
        <button id="modal-ok" class="w-2/3 py-3 bg-cyan-400 text-black font-bold rounded-xl">読込</button>
      </div>
    </div>`;
    document.body.appendChild(this.el);

    this.el.querySelector('#modal-cancel')!.addEventListener('click', () => this.hide());
    this.el.querySelector('#modal-ok')!.addEventListener('click', async () => {
      const url = (this.el.querySelector('#modal-url') as HTMLInputElement).value;
      if (!url) return;
      try {
        const route = await RouteImporter.importFromUrl(url);
        this.hide();
        this.onLoaded(route);
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  public show(): void { this.el.classList.remove('hidden'); }
  public hide(): void { this.el.classList.add('hidden'); }
}
