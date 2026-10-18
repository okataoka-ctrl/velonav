export type TurnAction = 'straight' | 'left' | 'right' | 'slight_left' | 'slight_right' | 'u_turn';

export interface CuePoint {
  distFromStart: number;
  action: TurnAction;
  text: string;
}

export class NavigationStateMachine {
  private currentCueIndex = 0;
  private lastAnnounced = -1;

  constructor(private cues: CuePoint[]) {
    this.cues.sort((a, b) => a.distFromStart - b.distFromStart);
  }

  public update(dist: number, speedMps: number): { nextCue: CuePoint | null; distToTurn: number } {
    if (this.currentCueIndex >= this.cues.length) return { nextCue: null, distToTurn: 0 };

    const nextCue = this.cues[this.currentCueIndex];
    const distToTurn = nextCue.distFromStart - dist;

    if (distToTurn < -15) {
      this.currentCueIndex++;
      return this.update(dist, speedMps);
    }

    const alertDist = Math.min(400, Math.max(150, (speedMps || 5) * 15));

    if (distToTurn <= alertDist && distToTurn > 30 && this.lastAnnounced !== this.currentCueIndex) {
      this.speak(`まもなく、${Math.round(distToTurn)}メートル先、${nextCue.text}`);
      this.lastAnnounced = this.currentCueIndex;
    } else if (distToTurn <= 30 && distToTurn > 0 && this.lastAnnounced === this.currentCueIndex) {
      this.speak(`ここを、${nextCue.text}`);
      this.lastAnnounced = this.currentCueIndex + 0.5;
    }

    return { nextCue, distToTurn: Math.max(0, distToTurn) };
  }

  private speak(msg: string): void {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = 'ja-JP';
    u.rate = 1.15;
    window.speechSynthesis.speak(u);
  }
}
