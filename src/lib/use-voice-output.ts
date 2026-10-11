"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserVoiceOutput, idlePlayback, preferredVoice } from "./voice-output.ts";

export function useVoiceOutput() {
  const output = useRef<BrowserVoiceOutput | null>(null);
  const [playback,setPlayback] = useState(idlePlayback), [supported,setSupported] = useState<boolean | null>(null);
  const [voices,setVoices] = useState<SpeechSynthesisVoice[]>([]), [voiceId,setVoiceId] = useState(""), [rate,setRate] = useState(1);
  const selected = useRef("");
  const explicitVoice = useRef(false);
  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window) || typeof window.speechSynthesis?.speak !== "function") { setSupported(false); return; }
    const synth = window.speechSynthesis;
    const controller = new BrowserVoiceOutput(synth,text => new SpeechSynthesisUtterance(text),setPlayback);
    output.current = controller; setSupported(true);
    const refresh = () => {
      let available: SpeechSynthesisVoice[] = [];
      try { available = synth.getVoices(); } catch { /* browser default voice remains available to try */ }
      setVoices(available);
      const voice = (explicitVoice.current ? available.find(item => item.voiceURI === selected.current) : undefined) ?? preferredVoice(available);
      selected.current = voice?.voiceURI ?? ""; setVoiceId(selected.current); controller.voice = voice;
    };
    const leave = () => controller.stop();
    const hidden = () => { if (document.hidden) controller.stop(); };
    refresh(); synth.addEventListener("voiceschanged",refresh);
    window.addEventListener("pagehide",leave); window.addEventListener("popstate",leave); window.addEventListener("hashchange",leave);
    document.addEventListener("visibilitychange",hidden);
    return () => { controller.dispose(); output.current = null; synth.removeEventListener("voiceschanged",refresh); window.removeEventListener("pagehide",leave); window.removeEventListener("popstate",leave); window.removeEventListener("hashchange",leave); document.removeEventListener("visibilitychange",hidden); };
  },[]);
  return { output,playback,supported,voices,voiceId,rate,
    selectVoice(id: string) { explicitVoice.current = true; selected.current = id; setVoiceId(id); output.current?.stop(); if (output.current) output.current.voice = voices.find(voice => voice.voiceURI === id); },
    changeRate(value: number) { const speed = Number.isFinite(value) ? Math.min(1.25,Math.max(.75,value)) : 1; setRate(speed); output.current?.stop(); if (output.current) output.current.rate = speed; },
  };
}
