export type VoiceLine = { speaker: string; text: string; id?: string };
export type VoicePlayback = { status: "idle" | "starting" | "speaking" | "paused" | "stopped" | "complete" | "error"; active: number; revealed: number; message: string };
export const idlePlayback: VoicePlayback = { status: "idle", active: -1, revealed: 0, message: "Choose a scenario. Audio starts only when you press Play Voice Demo." };

export function preferredVoice(voices: readonly SpeechSynthesisVoice[]) {
  // Local English voices require no network download. A named natural voice
  // is a preference, never an assumption about the browser's installed voices.
  return [...voices].sort((a,b) => score(b)-score(a))[0];
  function score(v: SpeechSynthesisVoice) { return (/^en(?:-|$)/i.test(v.lang) ? 50 : 0) + (v.localService ? 100 : 0) + (/natural|samantha|daniel|ava|aria|jenny/i.test(v.name) ? 10 : 0) + (v.default ? 2 : 0); }
}

/** Reusable output adapter. No microphone, external service or duration-driven
 * playback. Tokens isolate cancelled utterances, including synchronous cancel
 * events and Strict Mode cleanup. The controller owns only its utterance queue. */
export class BrowserVoiceOutput {
  private token = 0;
  private utterance: SpeechSynthesisUtterance | null = null;
  private lines: readonly VoiceLine[] = [];
  private cursor = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private restartOnResume = false;
  private disposed = false;
  state: VoicePlayback = { ...idlePlayback };
  voice?: SpeechSynthesisVoice;
  rate = 1;
  private synth: SpeechSynthesis;
  private create: (text: string) => SpeechSynthesisUtterance;
  private changed: (state: VoicePlayback) => void;
  constructor(synth: SpeechSynthesis, create: (text: string) => SpeechSynthesisUtterance, changed: (state: VoicePlayback) => void) { this.synth = synth; this.create = create; this.changed = changed; }
  private publish(patch: Partial<VoicePlayback>) { if (!this.disposed) { this.state = { ...this.state, ...patch }; this.changed(this.state); } }
  private invalidate() {
    ++this.token; clearTimeout(this.timer);
    const owned = this.utterance; this.utterance = null;
    // Detach before cancel: browsers may synchronously report cancellation.
    if (owned) { owned.onstart = owned.onend = owned.onpause = owned.onresume = owned.onerror = null; this.synth.cancel(); }
  }
  play(lines: readonly VoiceLine[]) {
    if (this.disposed) return;
    this.invalidate(); this.lines = lines; this.cursor = 0; this.restartOnResume = false;
    this.publish({ ...idlePlayback, status: "starting", message: "Waiting for the browser voice to start…" });
    this.next();
  }
  private next() {
    while (this.cursor < this.lines.length && this.lines[this.cursor].speaker !== "Receptionist") this.cursor++;
    if (this.cursor >= this.lines.length) { this.utterance = null; this.publish({ status:"complete", active:-1, revealed:this.lines.length, message:"Sample conversation complete. No reservation or call was created." }); return; }
    const index = this.cursor, token = this.token;
    let utterance: SpeechSynthesisUtterance;
    try { utterance = this.create(this.lines[index].text); } catch { this.fail("Speech is unavailable. Read the transcript or try another voice."); return; }
    this.utterance = utterance;
    try {
      utterance.voice = this.voice ?? null; utterance.lang = this.voice?.lang ?? "en-US";
      utterance.rate = Number.isFinite(this.rate) ? Math.min(1.25,Math.max(.75,this.rate)) : 1;
    } catch { this.fail("This browser cannot use the selected voice settings. Choose another voice and replay, or read the full transcript."); return; }
    const valid = () => !this.disposed && token === this.token && this.utterance === utterance;
    this.publish({ status:"starting", active:-1, revealed:index+1 });
    utterance.onstart = () => { if (valid()) { clearTimeout(this.timer); this.publish({ status:"speaking",active:index,message:"Receptionist speaking." }); } };
    utterance.onpause = () => { if (valid()) { clearTimeout(this.timer); this.publish({ status:"paused",active:-1,message:"Audio paused. Resume to continue." }); } };
    utterance.onresume = () => { if (valid()) { clearTimeout(this.timer); this.publish({ status:"speaking",active:index,message:"Receptionist speaking." }); } };
    utterance.onend = () => { if (valid()) { clearTimeout(this.timer); this.utterance = null; this.cursor = index+1; this.next(); } };
    utterance.onerror = () => { if (valid()) this.fail("This browser voice could not play. The full transcript remains available. Choose another voice and replay."); };
    // A startup watchdog detects missing events, not an estimated speech duration.
    this.timer = setTimeout(() => { if (valid() && this.state.status === "starting") this.fail("The browser did not start audio. Try a local voice and replay; the transcript is available."); },5000);
    try { if (this.synth.paused) this.synth.resume(); this.synth.speak(utterance); }
    catch { this.fail("Audio could not start. Read the transcript or choose another voice and replay."); }
  }
  pause() {
    if (this.state.status !== "speaking" && this.state.status !== "starting") return;
    clearTimeout(this.timer);
    try { this.synth.pause(); } catch { /* use explicit restart fallback below */ }
    if ((this.state.status as VoicePlayback["status"]) === "paused") return;
    this.timer = setTimeout(() => {
      if (this.disposed || !this.utterance || this.state.status === "paused") return;
      if (this.synth.paused) this.publish({ status:"paused",active:-1,message:"Audio paused. Resume to continue." });
      else { this.invalidate(); this.restartOnResume = true; this.publish({ status:"paused",active:-1,message:"This browser cannot pause reliably. Resume restarts the current response." }); }
    },250);
  }
  resume() {
    if (this.state.status !== "paused") return;
    if (this.restartOnResume) { this.restartOnResume = false; this.next(); return; }
    try { this.synth.resume(); } catch { /* use explicit restart fallback below */ }
    if ((this.state.status as VoicePlayback["status"]) === "speaking") return;
    this.timer = setTimeout(() => {
      if (this.disposed || this.state.status !== "paused") return;
      this.invalidate(); this.restartOnResume = true;
      this.publish({ active:-1,message:"Resume was not acknowledged. Press Resume again to restart this response." });
    },250);
  }
  stop() { this.invalidate(); this.restartOnResume = false; this.publish({ status:"stopped",active:-1,message:"Audio stopped. The transcript remains available." }); }
  reset() { this.invalidate(); this.lines = []; this.cursor = 0; this.restartOnResume = false; this.publish({ ...idlePlayback }); }
  private fail(message: string) { this.invalidate(); this.publish({ status:"error",active:-1,revealed:this.lines.length,message }); }
  dispose() { if (!this.disposed) { this.invalidate(); this.disposed = true; } }
}
