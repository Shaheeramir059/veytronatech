"use client";
import { useEffect, useReducer, useState } from "react";
import { initialWorkflow, workflowReducer, workflowOutput, WORKFLOW_STEPS, initialVoice, voiceReducer, voiceConversation, VOICE_SCENARIOS, type WorkflowState, type VoiceState } from "@/lib/demo-motion";
import type { BusinessRequest } from "@/lib/business-navigation";
import { useVoiceOutput } from "@/lib/use-voice-output";
import { useRecordedVoice } from "@/lib/use-recorded-voice";
function useMotionPreference() {
  const [reduced,setReduced] = useState(true);
  useEffect(() => { const media = matchMedia("(prefers-reduced-motion: reduce)"); const update = () => setReduced(media.matches); update(); media.addEventListener("change",update); return () => media.removeEventListener("change",update); }, []);
  return reduced;
}
export function AutomationDemo({ onNavigate }: { onNavigate: (request: BusinessRequest) => void }) {
  const [state,dispatch] = useReducer(workflowReducer,initialWorkflow), reduced = useMotionPreference();
  useEffect(() => {
    if (!state.running || reduced) return;
    const timer = setTimeout(() => dispatch({ type:"next" }),1600);
    return () => clearTimeout(timer);
  }, [state.running,state.step,reduced]);
  useEffect(() => { if (reduced) dispatch({ type:"pause" }); }, [reduced]);
  return <section className="demo-surface" aria-label="Interactive lead workflow demo">
    <div className="demo-heading"><span className="status-tag">Interactive Demo</span><span className="muted">Simulation · No connected systems</span></div>
    <p className="panel-intro">Follow a sample inquiry from capture to a staff summary. Change its interest or timing to see how the draft next action changes.</p>
    <div className="demo-settings"><label>Sample interest<select value={state.interest} onChange={event => dispatch({ type:"configure",interest:event.target.value as WorkflowState["interest"],timing:state.timing })}>{["Website","Automation","Voice"].map(value => <option key={value}>{value}</option>)}</select></label><label>Timing<select value={state.timing} onChange={event => dispatch({ type:"configure",interest:state.interest,timing:event.target.value as WorkflowState["timing"] })}><option>Soon</option><option>Exploring</option></select></label></div>
    <ol className="workflow-track">{WORKFLOW_STEPS.map((step,index) => <li key={step.name} className={`${state.step >= index ? "step-complete" : ""} ${state.running && state.step === index ? "step-running" : ""}`}><button type="button" aria-pressed={state.selected === index} onClick={() => dispatch({ type:"inspect",step:index })}><span className="workflow-number">0{index+1}</span><span>{step.name}</span><small>{state.step > index ? "Prepared" : state.step === index ? "Current step" : "Inspect step"}</small></button></li>)}</ol>
    <div className="workflow-detail"><p className="panel-kicker">STEP 0{state.selected+1}</p><h3>{WORKFLOW_STEPS[state.selected].name}</h3><p>{WORKFLOW_STEPS[state.selected].description}</p><div className="sample-output">{workflowOutput(state,state.selected)}</div></div>
    <div className="panel-actions"><button className="studio-button" type="button" onClick={() => dispatch({ type:"start",automatic:!reduced })}>{state.step < 0 ? "Start" : "Replay"}</button><button className="studio-button secondary" type="button" disabled={state.step >= 4} onClick={() => dispatch({ type:"next" })}>Next step</button>{state.running && <button className="studio-button secondary" type="button" onClick={() => dispatch({ type:"pause" })}>Pause</button>}<button className="text-button" type="button" onClick={() => onNavigate({ view:"inquiry",service:"automation",intent:"demo" })}>Request a Demo ↗</button></div>
    <p className="demo-note" role="status">{state.step === 4 ? "Sample workflow complete. Nothing was written or sent." : state.step < 0 ? "Ready to explore the sample workflow." : reduced ? "Reduced motion: use Next step to advance." : `Sample step ${state.step+1} of 5${state.running ? " · Playing" : " · Paused"}.`}</p>
  </section>;
}
export function VoiceDemo({ onNavigate }: { onNavigate: (request: BusinessRequest) => void }) {
  const [state,dispatch] = useReducer(voiceReducer,initialVoice), reduced = useMotionPreference();
  const natural = useRecordedVoice(reduced), browser = useVoiceOutput();
  const [mode,setMode] = useState<"recorded" | "browser">("recorded"), [audioSession,setAudioSession] = useState(false);
  const { output,playback } = mode === "recorded" ? natural : browser;
  const ready = mode === "recorded" ? natural.ready : browser.supported;
  const full = voiceConversation({ ...state,turn:6 });
  const conversation = voiceConversation(audioSession ? {...state,turn:Math.min(6,playback.revealed)} : state);
  const turns = audioSession ? full.turns.slice(0,playback.revealed) : conversation.turns;
  const { available,staffReady,status } = conversation;
  const busy = ["starting","speaking","paused"].includes(playback.status);
  function stopBoth() { natural.output.current?.reset(); browser.output.current?.reset(); }
  function play() { setAudioSession(true); output.current?.play(full.turns); }
  function configure(guests: number,time: VoiceState["time"],scenario=state.scenario) { stopBoth(); setAudioSession(false); dispatch({type:"configure",guests,time,scenario}); }
  function transcript() { stopBoth(); setAudioSession(false); dispatch({type:"start"}); for (let i=1;i<6;i++) dispatch({type:"next"}); }
  return <section className="demo-surface" aria-label="Restaurant receptionist interactive demo">
    <div className="demo-heading"><span className="status-tag">Audible Interactive Demo — Simulated Conversation</span><span className="muted">No phone connection · No microphone</span></div>
    <p className="panel-intro">Hear a warm, locally generated receptionist voice. Explore sample requests and restaurant information; no reservation, call or staff notification is created.</p>
    <div className="demo-settings">
      <label>Conversation scenario<select value={state.scenario ?? "reservation"} onChange={event => configure(state.guests,state.time,event.target.value as VoiceState["scenario"])}>{Object.entries(VOICE_SCENARIOS).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label>Guests<select value={state.guests} onChange={event => configure(Number(event.target.value),state.time)}>{[2,4,6,8,12].map(value => <option key={value} value={value}>{value} guests</option>)}</select></label>
      <label>Tomorrow evening<select value={state.time} onChange={event => configure(state.guests,event.target.value as VoiceState["time"])}><option value="18:30">6:30 PM (sample unavailable)</option><option value="19:00">7:00 PM</option><option value="20:00">8:00 PM</option></select></label>
    </div>
    <div className="voice-controls"><div className="demo-settings">
      <label>Audio source<select value={mode} onChange={event => {stopBoth();setAudioSession(false);setMode(event.target.value as typeof mode);}}><option value="recorded">Natural prerecorded voice</option><option value="browser">Browser voice fallback</option></select></label>
      {mode === "recorded" ? <label>Volume · {Math.round(natural.volume*100)}%<input type="range" min="0" max="1" step="0.05" value={natural.volume} onChange={event => natural.changeVolume(Number(event.target.value))} /></label> : <>
        <label>Browser voice<select value={browser.voiceId} disabled={!browser.supported || !browser.voices.length} onChange={event => browser.selectVoice(event.target.value)}>{!browser.voices.length && <option value="">Browser default</option>}{browser.voices.map(voice => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}{voice.localService ? " · Local" : " · Browser network voice"}</option>)}</select></label>
        <label>Speaking speed<select value={browser.rate} disabled={!browser.supported} onChange={event => browser.changeRate(Number(event.target.value))}>{[.75,.9,1,1.1,1.25].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
      </>}
    </div>
      <div className="panel-actions"><button className="studio-button" type="button" disabled={!ready || busy} onClick={play}>Play Voice Demo</button><button className="studio-button secondary" type="button" disabled={playback.status !== "speaking" && playback.status !== "starting"} onClick={() => output.current?.pause()}>Pause</button><button className="studio-button secondary" type="button" disabled={playback.status !== "paused"} onClick={() => output.current?.resume()}>Resume</button><button className="studio-button secondary" type="button" disabled={!busy} onClick={() => output.current?.stop()}>Stop</button><button className="text-button" type="button" disabled={!ready || busy} onClick={play}>Replay audio</button></div>
      <p role="status" className="demo-note">{mode === "recorded" ? natural.error || (!natural.ready ? "Preparing prerecorded audio. The transcript is available immediately." : playback.message) : browser.supported === false ? "Browser speech is unavailable. Read the transcript below." : `Browser voice fallback · ${playback.message}`}</p>
      {mode === "recorded" && natural.error && <button className="text-button" type="button" onClick={natural.retry}>Retry loading recordings</button>}
      {mode === "recorded" && natural.analysisNote && <p className="demo-note">{natural.analysisNote}</p>}
      <p className="demo-note">{mode === "recorded" ? "Only the receptionist speaks. Recordings use one Kokoro model preset voice, generated offline. No microphone or voice service is used. On some mobile devices, use the system volume controls." : "Optional browser speech fallback. Its voice quality depends on your device; network voices may use the browser's voice service."} Changing the scenario or audio source stops playback.</p>
    </div>
    <div className="voice-layout"><div><div ref={natural.waveform} className={`demo-waveform ${mode === "recorded" ? "wave-live" : ""}`} data-speaking={playback.status === "speaking"} aria-hidden="true">{Array.from({length:25},(_,index) => <i key={index} style={{height:`${12+Math.abs(Math.sin(index*1.73))*34}px`}} />)}</div>
      <ol className="conversation-timeline" aria-label="Sample conversation transcript">{turns.map((turn,index) => <li key={`${index}-${turn.text}`} aria-current={playback.active === index ? "true" : undefined} className={`${turn.speaker === "Customer" ? "customer-turn" : "agent-turn"} ${playback.active === index ? "turn-speaking" : ""}`}><span>{turn.speaker}{playback.active === index ? " · Speaking" : ""}</span><p>{turn.text}</p></li>)}</ol>{turns.length === 0 && <p className="demo-empty">Choose a sample request, then start the conversation.</p>}</div>
      <aside className="reservation-preview"><p className="panel-kicker">REQUEST PREVIEW</p><h3>{status}</h3><dl><div><dt>Party</dt><dd>{state.guests} guests</dd></div><div><dt>Requested date</dt><dd>Tomorrow (example)</dd></div><div><dt>Requested time</dt><dd>{state.time}</dd></div><div><dt>Reservation</dt><dd>Not confirmed</dd></div></dl>{staffReady && <div className="staff-preview"><h4>Staff notification preview</h4><p>Table request: {state.guests} guests at {state.time}. {state.handoff || !available ? "A host would review alternatives and take over." : "Staff would verify availability and contact details before confirming."}</p><small>Preview only · No notification sent</small></div>}</aside>
    </div>
    <div className="panel-actions"><button className="studio-button secondary" type="button" onClick={() => {stopBoth();setAudioSession(false);dispatch({type:state.turn === 0 ? "start" : "reset"});}}>{state.turn === 0 ? "Start conversation" : "Reset / Replay"}</button><button className="studio-button secondary" type="button" disabled={busy || state.turn === 0 || state.turn >= 6 || state.handoff} onClick={() => {setAudioSession(false);dispatch({type:"next"});}}>Next turn</button><button className="studio-button secondary" type="button" disabled={state.handoff} onClick={() => {stopBoth();setAudioSession(false);dispatch({type:"handoff"});}}>Show human handoff</button><button className="text-button" type="button" onClick={transcript}>Read full transcript</button><button className="text-button" type="button" onClick={() => {stopBoth();onNavigate({view:"inquiry",service:"voice",intent:"demo"});}}>Request a Demo ↗</button></div>
    <p className="demo-note">{state.handoff ? "Human handoff preview. No call is transferred. Press Play Voice Demo to hear the simulated host handoff." : "Sample availability only. Requests remain unconfirmed and require staff review."}</p>
  </section>;
}
