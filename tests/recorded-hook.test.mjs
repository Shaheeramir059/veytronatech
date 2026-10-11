import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React,{act} from 'react';
import {createRoot} from '@react-three/fiber';
import {useRecordedVoice} from '../src/lib/use-recorded-voice.ts';
import {initialVoice,voiceConversation} from '../src/lib/demo-motion.ts';
import {rendererHarness} from './helpers/renderer.mjs';
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const manifest=JSON.parse(fs.readFileSync('public/audio/receptionist/manifest.json'));
const lines=voiceConversation({...initialVoice,turn:6}).turns;
class AudioElement extends EventTarget {
  static all=[];paused=true;ended=false;volume=1;src='';plays=0;
  constructor(){super();AudioElement.all.push(this);}
  getAttribute(key){return key==='src'?this.src:null;}
  removeAttribute(key){if(key==='src')this.src='';} load(){}
  pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}
  play(){this.paused=false;this.plays++;return Promise.resolve();}
}
class AudioEngine {
  static all=[];state='suspended';bindings=[];closed=false;destination={};
  constructor(){AudioEngine.all.push(this);}
  async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.closed=true;this.state='closed';}
  createAnalyser(){return{fftSize:256,connect(){},disconnect(){},getByteTimeDomainData(buffer){buffer.fill(160);}};}
  createMediaElementSource(audio){assert.ok(!this.bindings.includes(audio),'One binding per media element');this.bindings.push(audio);return{connect(){},disconnect(){}};}
}

test('actual recorded hook loads only a manifest, handles analysis/visibility/navigation and releases Strict Mode owners',async()=>{
  const keys=['window','document','Audio','fetch','requestAnimationFrame','cancelAnimationFrame'],original=Object.fromEntries(keys.map(key=>[key,globalThis[key]]));
  const win=new EventTarget(),doc=new EventTarget();win.devicePixelRatio=1;win.AudioContext=AudioEngine;doc.hidden=false;
  const requests=[],frames=new Map();let counter=0;
  Object.assign(globalThis,{window:win,document:doc,Audio:AudioElement,fetch:async(url,options)=>{requests.push({url,options});return new Response(JSON.stringify(manifest));},requestAnimationFrame:callback=>{frames.set(++counter,callback);return counter;},cancelAnimationFrame:id=>frames.delete(id)});
  AudioElement.all=[];AudioEngine.all=[];
  const gl=rendererHarness(),root=createRoot(gl.domElement);let api;
  function Probe({reduced=false}){api=useRecordedVoice(reduced);return null;}
  try {
    await root.configure({gl,frameloop:'never',dpr:1,size:{width:390,height:844,top:0,left:0}});
    await act(async()=>{root.render(React.createElement(Probe));});
    assert.equal(api.ready,true);assert.deepEqual(requests.map(r=>r.url),['/audio/receptionist/manifest.json']);assert.equal(AudioElement.all.length,0);
    const levels=[];api.waveform.current={style:{setProperty:(key,value)=>levels.push({key,value})}};
    await act(async()=>{api.output.current.play(lines);AudioElement.all[0].dispatchEvent(new Event('playing'));});
    assert.equal(api.playback.status,'speaking');assert.equal(AudioElement.all.length,2);assert.equal(AudioEngine.all.length,1);assert.equal(AudioEngine.all[0].bindings.length,1);
    const frame=[...frames.values()][0];frames.clear();frame();assert.ok(Number(levels.at(-1).value)>.15);
    await act(async()=>root.render(React.createElement(Probe,{reduced:true})));assert.equal(frames.size,0);
    await act(async()=>root.render(React.createElement(Probe)));assert.equal(frames.size,1);
    for(const event of ['hashchange','popstate','pagehide']){await act(async()=>{api.output.current.play(lines);win.dispatchEvent(new Event(event));});assert.equal(api.playback.status,'stopped');}
    await act(async()=>{api.output.current.play(lines);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));});assert.equal(api.playback.status,'stopped');assert.equal(frames.size,0);
    const owned=api.output.current;await act(async()=>root.render(null));assert.equal(api.output.current,null);assert.equal(requests[0].options.signal.aborted,true);assert.ok(AudioEngine.all.every(engine=>engine.closed));assert.ok(AudioElement.all.every(audio=>audio.src===''));
    await act(async()=>root.render(React.createElement(Probe)));assert.notEqual(api.output.current,owned);assert.equal(requests.length,2);assert.equal(api.playback.status,'idle');
    await act(async()=>root.render(null));
    globalThis.fetch=async()=>new Response('missing',{status:404});await act(async()=>root.render(React.createElement(Probe)));assert.equal(api.ready,false);assert.match(api.error,/Browser voice fallback/);assert.equal(api.output.current,null);
    globalThis.fetch=async()=>new Response(JSON.stringify(manifest));await act(async()=>api.retry());assert.equal(api.ready,true);assert.equal(api.error,'');
    await act(async()=>root.render(null));
    // Denied analysis must leave native media routing intact and report the
    // enhancement's limitation, without switching engines or failing speech.
    class DeniedAnalysis extends AudioEngine {async resume(){throw new Error('gesture denied');}createMediaElementSource(){assert.fail('Do not reroute media into a suspended context');}}
    win.AudioContext=DeniedAnalysis;doc.hidden=false;
    await act(async()=>root.render(React.createElement(Probe)));
    await act(async()=>{api.output.current.play(lines);AudioElement.all.at(-2).dispatchEvent(new Event('playing'));});
    assert.equal(api.playback.status,'speaking');assert.equal(api.error,'');assert.match(api.analysisNote,/ordinary audio playback/);assert.equal(AudioEngine.all.at(-1).bindings.length,0);
  } finally {await act(async()=>root.unmount());Object.assign(globalThis,original);}
});
