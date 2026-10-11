import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot } from '@react-three/fiber';
import { BrowserVoiceOutput, preferredVoice } from '../src/lib/voice-output.ts';
import { useVoiceOutput } from '../src/lib/use-voice-output.ts';
import { initialVoice, voiceConversation } from '../src/lib/demo-motion.ts';
import { rendererHarness } from './helpers/renderer.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
class Utterance { constructor(text) { this.text=text; } }
class Synth extends EventTarget {
  calls=[]; cancellations=0; paused=false; voices=[];
  getVoices() { return this.voices; }
  speak(utterance) { this.calls.push(utterance); }
  cancel() { this.cancellations++; this.paused=false; }
  pause() { this.paused=true; this.calls.at(-1)?.onpause?.(); }
  resume() { this.paused=false; this.calls.at(-1)?.onresume?.(); }
}
const lines=voiceConversation({...initialVoice,turn:6}).turns;
function harness(synth=new Synth()) { const changes=[]; return { synth,changes,output:new BrowserVoiceOutput(synth,text=>new Utterance(text),state=>changes.push(state)) }; }
test('speech starts only on explicit play, AI turns reveal in event order, and waveform state follows actual events',()=>{
  const {output,synth}=harness(); assert.equal(synth.calls.length,0);
  output.play(lines); assert.equal(output.state.status,'starting'); assert.equal(output.state.revealed,2); assert.equal(output.state.active,-1);
  const first=synth.calls[0]; assert.equal(first.text,lines[1].text);
  first.onstart(); assert.equal(output.state.status,'speaking'); assert.equal(output.state.active,1);
  output.pause(); assert.equal(output.state.status,'paused'); assert.equal(output.state.active,-1);
  output.resume(); assert.equal(output.state.status,'speaking'); assert.equal(output.state.active,1);
  first.onend(); assert.equal(output.state.status,'starting'); assert.equal(output.state.revealed,4);
  synth.calls[1].onstart(); assert.equal(output.state.active,3); synth.calls[1].onend();
  synth.calls[2].onstart(); assert.equal(output.state.active,4); synth.calls[2].onend();
  assert.equal(output.state.status,'complete'); assert.equal(output.state.revealed,6); assert.equal(output.state.active,-1);
  assert.equal(synth.calls.length,3); assert.deepEqual(synth.calls.map(u=>u.text),lines.filter(line=>line.speaker==='Receptionist').map(line=>line.text)); output.dispose();
});
test('stop, replacement, scenario reset and disposal invalidate stale callbacks without duplicate utterances',()=>{
  const {output,synth,changes}=harness(); output.play(lines);
  const first=synth.calls[0], lateStart=first.onstart, lateEnd=first.onend, lateError=first.onerror;
  output.play(lines); assert.equal(synth.cancellations,1);
  lateStart(); lateEnd(); lateError(); assert.equal(synth.calls.length,2); assert.equal(output.state.status,'starting');
  synth.calls[1].onstart(); output.stop(); assert.equal(output.state.status,'stopped'); assert.equal(output.state.revealed,2); assert.equal(output.state.active,-1);
  output.reset(); assert.equal(output.state.revealed,0);
  output.play(lines); const final=synth.calls.at(-1).onend, count=changes.length;
  output.dispose(); output.dispose(); final(); output.play(lines); assert.equal(changes.length,count); assert.equal(synth.calls.length,3); assert.equal(synth.cancellations,3);
});
test('unreliable pause/resume is a user-controlled restart, never simulated timed speech',context=>{
  context.mock.timers.enable({apis:['setTimeout']});
  const synth=new Synth(); synth.pause=()=>{}; synth.resume=()=>{};
  const {output}=harness(synth); output.play(lines); synth.calls[0].onstart(); output.pause(); context.mock.timers.tick(250);
  assert.equal(output.state.status,'paused'); assert.equal(synth.cancellations,1); assert.match(output.state.message,/restarts/);
  output.resume(); assert.equal(synth.calls.length,2); assert.equal(synth.calls[1].text,lines[1].text); synth.calls[1].onstart();
  synth.pause=()=>{synth.paused=true;}; output.pause(); context.mock.timers.tick(250); assert.equal(output.state.status,'paused');
  output.resume(); context.mock.timers.tick(250); assert.match(output.state.message,/Press Resume again/); assert.equal(synth.calls.length,2);
  output.resume(); assert.equal(synth.calls.length,3); output.dispose();
});
test('startup watchdog and synthesis errors leave the complete transcript readable and release owned speech',context=>{
  context.mock.timers.enable({apis:['setTimeout']});
  const {output,synth}=harness(); output.play(lines); context.mock.timers.tick(5000);
  assert.equal(output.state.status,'error'); assert.equal(output.state.revealed,lines.length); assert.equal(synth.cancellations,1);
  output.play(lines); synth.calls.at(-1).onstart(); context.mock.timers.tick(60_000);
  assert.equal(output.state.status,'speaking'); // No estimated utterance duration.
  synth.calls.at(-1).onerror({error:'voice-unavailable'}); assert.equal(output.state.status,'error'); assert.equal(output.state.revealed,lines.length);
  output.dispose();
});
test('booking, unavailable time, large party and host handoff all produce the corresponding audible script',()=>{
  for (const scenario of [{guests:4,time:'19:00'},{guests:4,time:'18:30'},{guests:12,time:'20:00'},{guests:4,time:'19:00',handoff:true}]) {
    const {output,synth}=harness(), conversation=voiceConversation({...initialVoice,...scenario,turn:6}); output.play(conversation.turns);
    while(output.state.status!=='complete') { const current=synth.calls.at(-1); current.onstart(); current.onend(); }
    assert.deepEqual(synth.calls.map(u=>u.text),conversation.turns.filter(line=>line.speaker==='Receptionist').map(line=>line.text));
    if(scenario.handoff) assert.match(synth.calls.at(-1).text,/handoff/i); output.dispose();
  }
});
test('local English voices are preferred, voice and bounded speed are passed to actual utterances',()=>{
  const local={name:'Samantha',lang:'en-GB',localService:true,voiceURI:'local'}, remote={name:'Natural',lang:'en-US',localService:false,voiceURI:'remote'};
  assert.equal(preferredVoice([remote,local]),local); assert.equal(preferredVoice([]),undefined);
  const {output,synth}=harness(); output.voice=local; output.rate=9; output.play(lines);
  assert.equal(synth.calls[0].voice,local); assert.equal(synth.calls[0].rate,1.25); assert.equal(synth.calls[0].lang,'en-GB'); output.dispose();
  const other=harness(); other.output.rate=NaN; other.output.play(lines); assert.equal(other.synth.calls[0].rate,1); other.output.dispose();
  const unsupported=new BrowserVoiceOutput(new Synth(),()=>({set voice(value){throw new Error('unsupported setting');}}),()=>{});
  assert.doesNotThrow(()=>unsupported.play(lines)); assert.equal(unsupported.state.status,'error'); assert.equal(unsupported.state.revealed,lines.length); unsupported.dispose();
});
test('actual voice hook handles async voices, settings, navigation/visibility and mount cleanup/replay',async()=>{
  const originalWindow=globalThis.window, originalDocument=globalThis.document, originalUtterance=globalThis.SpeechSynthesisUtterance;
  const win=new EventTarget(), doc=new EventTarget(), synth=new Synth(); win.speechSynthesis=synth; win.SpeechSynthesisUtterance=Utterance; win.devicePixelRatio=1; doc.hidden=false;
  globalThis.window=win; globalThis.document=doc; globalThis.SpeechSynthesisUtterance=Utterance;
  const gl=rendererHarness(), root=createRoot(gl.domElement); let api;
  function Probe() { api=useVoiceOutput(); return null; }
  try {
    await root.configure({gl,frameloop:'never',dpr:1,size:{width:390,height:844,top:0,left:0}});
    await act(async()=>{root.render(React.createElement(Probe));});
    assert.equal(api.supported,true); assert.equal(synth.calls.length,0); assert.equal(api.voices.length,0);
    synth.voices=[{name:'Local English',lang:'en-US',localService:true,voiceURI:'local'}];
    await act(async()=>{synth.dispatchEvent(new Event('voiceschanged'));}); assert.equal(api.voiceId,'local');
    await act(async()=>{api.output.current.play(lines); synth.calls.at(-1).onstart(); api.changeRate(.9);}); assert.equal(api.playback.status,'stopped');
    await act(async()=>{api.output.current.play(lines); api.selectVoice('local');}); assert.equal(api.playback.status,'stopped');
    for(const event of ['hashchange','popstate','pagehide']) { await act(async()=>{api.output.current.play(lines); win.dispatchEvent(new Event(event));}); assert.equal(api.playback.status,'stopped'); }
    await act(async()=>{api.output.current.play(lines); doc.hidden=true; doc.dispatchEvent(new Event('visibilitychange'));}); assert.equal(api.playback.status,'stopped');
    await act(async()=>{api.output.current.play(lines);}); const old=api.output.current, stale=synth.calls.at(-1).onend;
    await act(async()=>{root.render(null);}); assert.equal(api.output.current,null); stale(); assert.equal(old.state.status,'starting');
    await act(async()=>{root.render(React.createElement(Probe));}); assert.notEqual(api.output.current,old); assert.equal(synth.calls.length,7);
    await act(async()=>{root.render(null);});
    delete win.SpeechSynthesisUtterance;
    await act(async()=>{root.render(React.createElement(Probe));});
    assert.equal(api.supported,false); assert.equal(api.output.current,null); assert.equal(synth.calls.length,7);
    await act(async()=>{root.render(null);});
  } finally { await act(async()=>root.unmount()); globalThis.window=originalWindow; globalThis.document=originalDocument; globalThis.SpeechSynthesisUtterance=originalUtterance; }
});
