import { idlePlayback, type VoiceLine, type VoicePlayback } from "./voice-output.ts";

export type Recording = { id:string; text:string; path:string; duration:number; branch:string; version:string; bytes:number; sha256:string };
export type RecordingManifest = { version:string; voice:string; model:string; entries:Record<string,Recording> };
export function recordingManifest(value: unknown): RecordingManifest {
  if (!value || typeof value !== "object") throw new Error("Invalid recording manifest");
  const manifest = value as RecordingManifest;
  if (typeof manifest.version !== "string" || typeof manifest.voice !== "string" || typeof manifest.model !== "string" || !manifest.entries || typeof manifest.entries !== "object" || Array.isArray(manifest.entries)) throw new Error("Invalid recording manifest");
  const entries = Object.entries(manifest.entries);
  if (!entries.length || entries.length > 200) throw new Error("Invalid recording count");
  for (const [id,entry] of entries) {
    if (!entry || entry.id !== id || !/^[a-z0-9-]+$/.test(id) || typeof entry.text !== "string" || !entry.text || typeof entry.path !== "string" || !/^\/audio\/receptionist\/v\d+-[a-z0-9-]+-[a-f0-9]{12}\.mp3$/.test(entry.path) || !Number.isFinite(entry.duration) || entry.duration <= 0 || entry.duration > 45 || entry.version !== manifest.version || typeof entry.branch !== "string" || !Number.isFinite(entry.bytes) || entry.bytes <= 0 || !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error(`Invalid recording: ${id}`);
  }
  return manifest;
}

/** One active media element, one optional next-line preload. Each line owns its
 * element so queued events from an abandoned source cannot advance its replacement. */
export class RecordedVoiceOutput {
  state: VoicePlayback = { ...idlePlayback };
  private create: () => HTMLAudioElement;
  private changed: (state: VoicePlayback) => void;
  private manifest: RecordingManifest;
  private connect: (audio: HTMLAudioElement) => (() => void) | undefined;
  private token = 0;
  private disposed = false;
  private lines: readonly VoiceLine[] = [];
  private cursor = 0;
  private owned: HTMLAudioElement | null = null;
  private preload: { path:string; audio:HTMLAudioElement } | null = null;
  private listeners: (() => void) | undefined;
  private detach: (() => void) | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private loudness = .85;
  constructor(manifest: RecordingManifest, create: () => HTMLAudioElement, changed: (state: VoicePlayback) => void, connect: (audio:HTMLAudioElement) => (() => void) | undefined = () => undefined) {
    this.manifest = manifest; this.create = create; this.changed = changed; this.connect = connect;
  }
  private publish(patch: Partial<VoicePlayback>) { if (!this.disposed) { this.state = { ...this.state,...patch }; this.changed(this.state); } }
  private release(audio: HTMLAudioElement) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
  private clearCurrent() { clearTimeout(this.timer); this.listeners?.(); this.listeners = undefined; this.detach?.(); this.detach = undefined; if (this.owned) this.release(this.owned); this.owned = null; }
  private invalidate() { ++this.token; this.clearCurrent(); if (this.preload) this.release(this.preload.audio); this.preload = null; }
  setVolume(value:number) { this.loudness = Number.isFinite(value) ? Math.max(0,Math.min(1,value)) : .85; if (this.owned) this.owned.volume = this.loudness; }
  private recording(line: VoiceLine) { const entry = line.id ? this.manifest.entries[line.id] : undefined; if (!entry || entry.text !== line.text) throw new Error("Recording is missing or does not match the transcript"); return entry; }
  play(lines: readonly VoiceLine[]) { if (this.disposed) return; this.invalidate(); this.lines = lines; this.cursor = 0; this.publish({...idlePlayback,status:"starting",message:"Loading the receptionist recording…"}); this.next(); }
  private next() {
    while (this.cursor < this.lines.length && this.lines[this.cursor].speaker !== "Receptionist") this.cursor++;
    if (this.cursor === this.lines.length) { this.clearCurrent(); this.publish({status:"complete",active:-1,revealed:this.lines.length,message:"Sample conversation complete. No reservation or call was created."}); return; }
    const index = this.cursor, token = this.token;
    let entry: Recording, audio: HTMLAudioElement;
    try { entry = this.recording(this.lines[index]); audio = this.preload?.path === entry.path ? this.preload.audio : this.create(); }
    catch { this.fail("A recording is unavailable or outdated. Read the transcript or explicitly choose Browser voice fallback."); return; }
    if (this.preload?.audio !== audio && this.preload) this.release(this.preload.audio);
    this.preload = null; this.owned = audio;
    const valid = () => !this.disposed && this.token === token && this.owned === audio;
    const handlers: Record<string,EventListener> = {
      playing: () => { if (valid() && !audio.paused) { clearTimeout(this.timer); this.publish({status:"speaking",active:index,message:"Prerecorded receptionist speaking."}); } },
      pause: () => { if (valid() && !audio.ended) { clearTimeout(this.timer); this.publish({status:"paused",active:-1,message:"Audio paused. Resume to continue."}); } },
      waiting: () => { if (valid() && this.state.status !== "paused") { this.publish({status:"starting",active:-1,message:"Buffering the recording…"}); this.watch(valid); } },
      stalled: () => { if (valid() && this.state.status === "starting") this.watch(valid); },
      ended: () => { if (valid()) { this.clearCurrent(); this.cursor = index+1; this.next(); } },
      error: () => { if (valid()) this.fail("The recording could not play. Replay, read the transcript, or explicitly choose Browser voice fallback."); },
      abort: () => { if (valid()) this.fail("Recording playback was interrupted. Replay or read the transcript."); },
    };
    for (const [name,handler] of Object.entries(handlers)) audio.addEventListener(name,handler);
    this.listeners = () => { for (const [name,handler] of Object.entries(handlers)) audio.removeEventListener(name,handler); };
    this.publish({status:"starting",active:-1,revealed:index+1,message:"Loading the receptionist recording…"});
    try {
      audio.preload = "auto"; audio.volume = this.loudness;
      if (audio.getAttribute("src") !== entry.path) audio.src = entry.path;
      // Analysis is optional. Failure must never prevent ordinary media playback.
      try { this.detach = this.connect(audio); } catch { this.detach = undefined; }
      this.watch(valid);
      const playing = audio.play(); playing?.catch(() => { if (valid()) this.fail("Audio playback was blocked or interrupted. Press Replay audio, or use the transcript."); });
      // Only the immediately following receptionist response is prepared.
      const upcoming = this.lines.slice(index+1).find(line => line.speaker === "Receptionist");
      if (upcoming && valid()) {
        try { const recording = this.recording(upcoming); const next = this.create(); next.preload = "auto"; next.src = recording.path; this.preload = {path:recording.path,audio:next}; next.load(); } catch { /* Next response reports its own missing asset; current audio remains valid. */ }
      }
    } catch { this.fail("The recording could not initialize. Read the transcript or choose Browser voice fallback."); }
  }
  private watch(valid: () => boolean) { clearTimeout(this.timer); this.timer = setTimeout(() => { if (valid() && this.state.status === "starting") this.fail("The recording did not start. Check your connection and replay, or read the transcript."); },12000); }
  pause() { if (this.owned && (this.state.status === "speaking" || this.state.status === "starting")) { clearTimeout(this.timer); this.owned.pause(); this.publish({status:"paused",active:-1,message:"Audio paused. Resume to continue."}); } }
  resume() {
    if (!this.owned || this.state.status !== "paused") return;
    const audio = this.owned, token = this.token, valid = () => !this.disposed && token === this.token && this.owned === audio;
    this.publish({status:"starting",active:-1,message:"Resuming the recording…"}); this.watch(valid);
    try { audio.play()?.catch(() => { if (valid()) this.fail("Resume was blocked. Press Replay audio or read the transcript."); }); } catch { this.fail("The recording could not resume. Replay or read the transcript."); }
  }
  stop() { this.invalidate(); this.publish({status:"stopped",active:-1,message:"Audio stopped. The transcript remains available."}); }
  reset() { this.invalidate(); this.lines = []; this.cursor = 0; this.publish({...idlePlayback}); }
  private fail(message:string) { this.invalidate(); this.publish({status:"error",active:-1,revealed:this.lines.length,message}); }
  dispose() { if (!this.disposed) { this.invalidate(); this.disposed = true; } }
}
