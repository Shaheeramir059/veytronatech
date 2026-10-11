"use client";
import { useEffect, useRef, useState } from "react";
import { RecordedVoiceOutput, recordingManifest } from "./recorded-voice.ts";
import { idlePlayback } from "./voice-output.ts";

export function useRecordedVoice(reduced: boolean) {
  const output = useRef<RecordedVoiceOutput | null>(null);
  const waveform = useRef<HTMLDivElement | null>(null);
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  const refreshMeter = useRef<(() => void) | null>(null);
  const [playback,setPlayback] = useState(idlePlayback), [ready,setReady] = useState(false), [error,setError] = useState("");
  const [analysisNote,setAnalysisNote] = useState("");
  const [volume,setVolume] = useState(.85), [attempt,retry] = useState(0);
  const volumeRef = useRef(volume); volumeRef.current = volume;
  useEffect(() => {
    const abort = new AbortController(); let alive = true;
    let controller: RecordedVoiceOutput | null = null;
    let context: AudioContext | null = null, analyser: AnalyserNode | null = null;
    let buffer: Uint8Array<ArrayBuffer> | null = null;
    let frame = 0, running = false;
    const silence = () => { cancelAnimationFrame(frame); frame = 0; waveform.current?.style.setProperty("--audio-level","0.15"); };
    const tick = () => {
      if (!running || reducedRef.current || !analyser || !buffer || context?.state !== "running") { silence(); return; }
      analyser.getByteTimeDomainData(buffer);
      let sum = 0; for (let i=0;i<buffer.length;i++) { const sample=(buffer[i]-128)/128; sum+=sample*sample; }
      waveform.current?.style.setProperty("--audio-level",String(Math.min(1,.15+Math.sqrt(sum/buffer.length)*4)));
      frame = requestAnimationFrame(tick);
    };
    const changed = (state: typeof idlePlayback) => { if (!alive) return; setPlayback(state); running = state.status === "speaking"; silence(); if (running && !reducedRef.current) frame = requestAnimationFrame(tick); };
    refreshMeter.current = () => { silence(); if (running && !reducedRef.current) frame = requestAnimationFrame(tick); };
    const connect = (audio:HTMLAudioElement) => {
      const AudioEngine = window.AudioContext;
      if (!AudioEngine || reducedRef.current) return;
      try {
        context ??= new AudioEngine();
        let cancelled = false, source: MediaElementAudioSourceNode | null = null;
        const engine = context;
        // Resume during the Play gesture. Keep native media routing until the
        // context really runs, so a denied analyser never mutes the recording.
        void engine.resume().then(() => {
          if (cancelled || !alive || engine.state !== "running" || reducedRef.current) return;
          try {
            if (!analyser) { analyser = engine.createAnalyser(); analyser.fftSize = 256; buffer = new Uint8Array(256); analyser.connect(engine.destination); }
            source = engine.createMediaElementSource(audio); source.connect(analyser);
            silence(); if (running) frame = requestAnimationFrame(tick);
          } catch { source?.connect(engine.destination); }
        }).catch(() => { if (alive) setAnalysisNote("Sound-level analysis is unavailable. The recording uses ordinary audio playback with a speaking indicator."); });
        return () => { cancelled = true; source?.disconnect(); };
      } catch { return; }
    };
    setReady(false); setError(""); setAnalysisNote("");
    void fetch("/audio/receptionist/manifest.json",{signal:abort.signal,cache:"no-cache"}).then(async response => {
      if (!response.ok) throw new Error("Recordings unavailable");
      const manifest = recordingManifest(await response.json());
      if (!alive) return;
      controller = new RecordedVoiceOutput(manifest,() => new Audio(),changed,connect);
      controller.setVolume(volumeRef.current); output.current = controller; setReady(true);
    }).catch(() => { if (alive) setError("Prerecorded audio is unavailable. Retry loading, read the transcript, or select Browser voice fallback."); });
    const leave = () => { controller?.stop(); if (context?.state === "running") void context.suspend().catch(() => {}); };
    const hidden = () => { if (document.hidden) leave(); };
    window.addEventListener("pagehide",leave); window.addEventListener("popstate",leave); window.addEventListener("hashchange",leave); document.addEventListener("visibilitychange",hidden);
    return () => {
      alive = false; abort.abort(); controller?.dispose(); output.current = null; refreshMeter.current = null; silence(); analyser?.disconnect(); void context?.close().catch(() => {});
      window.removeEventListener("pagehide",leave); window.removeEventListener("popstate",leave); window.removeEventListener("hashchange",leave); document.removeEventListener("visibilitychange",hidden);
    };
  },[attempt]);
  useEffect(() => { refreshMeter.current?.(); },[reduced]);
  return { output,playback,ready,error,analysisNote,waveform,volume,
    changeVolume(value:number) { const next = Number.isFinite(value) ? Math.max(0,Math.min(1,value)) : .85; setVolume(next); output.current?.setVolume(next); },
    retry() { output.current?.stop(); setPlayback(idlePlayback); retry(value => value+1); },
  };
}
