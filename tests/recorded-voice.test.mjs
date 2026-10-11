import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { RecordedVoiceOutput, recordingManifest } from '../src/lib/recorded-voice.ts';
import { initialVoice, voiceConversation, VOICE_SCENARIOS, voiceReducer } from '../src/lib/demo-motion.ts';

const source = JSON.parse(fs.readFileSync('src/lib/receptionist-dialogue.json'));
const manifest = recordingManifest(JSON.parse(fs.readFileSync('public/audio/receptionist/manifest.json')));
const lines = voiceConversation({...initialVoice,turn:6}).turns;
class Media extends EventTarget {
  paused=true; ended=false; preload='none'; volume=1; attributes={}; plays=0; loads=0;
  get src() { return this.attributes.src; } set src(value) {this.attributes.src=value;}
  getAttribute(key) {return this.attributes[key] ?? null;}
  removeAttribute(key) {delete this.attributes[key];}
  load() {this.loads++;}
  play() {this.plays++;this.paused=false;return this.rejection ? Promise.reject(new Error('blocked')) : Promise.resolve();}
  pause() {this.paused=true;this.dispatchEvent(new Event('pause'));}
  event(name) {if(name==='ended')this.ended=true;this.dispatchEvent(new Event(name));}
}
function harness() {const media=[],changes=[],connections=[];const output=new RecordedVoiceOutput(manifest,()=>{const audio=new Media();media.push(audio);return audio;},state=>changes.push(state),audio=>{const entry={audio,detached:false};connections.push(entry);return()=>{entry.detached=true;};});return{output,media,changes,connections};}

test('every manifest asset exists, matches source and content hash, is compressed MP3, and has measured audio evidence',()=>{
  const evidence=JSON.parse(fs.readFileSync('performance/phase6-generation.json'));
  assert.equal(evidence.count,28);assert.equal(evidence.gpuInference,false);assert.deepEqual(evidence.provider,['CPUExecutionProvider']);
  assert.deepEqual(Object.keys(manifest.entries).sort(),Object.keys(source).sort());
  let bytes=0;
  for(const [id,recording] of Object.entries(manifest.entries)) {
    assert.equal(recording.text,source[id].text);assert.equal(recording.branch,source[id].branch);
    const data=fs.readFileSync(`public${recording.path}`); const digest=crypto.createHash('sha256').update(data).digest('hex');
    assert.equal(data.length,recording.bytes);assert.equal(digest,recording.sha256);assert.ok(recording.path.endsWith(`${digest.slice(0,12)}.mp3`));
    assert.equal(data.subarray(0,3).toString(),'ID3');bytes+=data.length;
    const measured=evidence.assets.find(asset=>asset.id===id);
    assert.ok(measured.lufs>=-19.5&&measured.lufs<=-16.5);assert.ok(measured.samplePeakDbFS<-.7);assert.ok(measured.truePeakDbTP<-.7);assert.equal(measured.sampleRate,24000);
  }
  assert.equal(bytes,evidence.totalAudioBytes);assert.equal(fs.readdirSync('public/audio/receptionist').filter(file=>file.endsWith('.mp3')).length,28);
});

test('all scenario, guest, time and handoff combinations resolve to truthful recorded dialogue without holes',()=>{
  const used=new Set();
  for(const scenario of Object.keys(VOICE_SCENARIOS)) for(const guests of [1,2,4,6,8,12]) for(const time of ['18:30','19:00','20:00']) for(const handoff of [false,true]) {
    const conversation=voiceConversation({...initialVoice,scenario,guests,time,handoff,turn:6});
    assert.equal(conversation.turns.length,handoff?7:6);
    for(const line of conversation.turns.filter(line=>line.speaker==='Receptionist')) {assert.ok(line.id);assert.equal(manifest.entries[line.id].text,line.text);used.add(line.id);}
    assert.doesNotMatch(conversation.status,/^confirmed|^booked/i);
    const reset=voiceReducer({...initialVoice,scenario,turn:6},{type:'configure',guests,time});assert.equal(reset.turn,0);assert.equal(reset.scenario,scenario);
  }
  assert.deepEqual([...used].sort(),Object.keys(source).sort());
});

test('media events advance the actual playlist, pause/resume preserve position and only one next response preloads',async()=>{
  const {output,media,connections}=harness();assert.equal(media.length,0);output.setVolume(.4);output.play(lines);
  assert.equal(media.length,2);assert.equal(media[0].volume,.4);assert.equal(media[0].plays,1);assert.equal(media[1].plays,0);
  assert.equal(output.state.status,'starting');assert.equal(output.state.active,-1);
  media[0].event('playing');assert.equal(output.state.active,1);assert.equal(output.state.status,'speaking');
  media[0].currentTime=2.4;output.pause();assert.equal(output.state.status,'paused');output.resume();assert.equal(media[0].currentTime,2.4);assert.equal(output.state.status,'starting');media[0].event('playing');
  media[0].event('waiting');assert.equal(output.state.active,-1);media[0].event('playing');
  media[0].event('ended');assert.equal(media.length,3);assert.equal(media[1].plays,1);assert.equal(media[2].plays,0);assert.equal(connections[0].detached,true);assert.equal(media[0].src,undefined);
  media[1].event('playing');assert.equal(output.state.active,3);media[1].event('ended');media[2].event('playing');assert.equal(output.state.active,4);media[2].event('ended');
  assert.equal(output.state.status,'complete');assert.equal(output.state.revealed,6);assert.equal(media.length,3);assert.ok(connections.every(item=>item.detached));output.dispose();await Promise.resolve();
});

test('replacement, stop, unmount and late rejection/events cannot advance or mutate a new owner',async()=>{
  const {output,media,changes}=harness();output.play(lines);const old=media[0];output.play(lines);
  const count=changes.length;for(const event of ['playing','error','abort','ended'])old.event(event);assert.equal(changes.length,count);assert.equal(output.state.status,'starting');
  output.setVolume(9);assert.equal(media[2].volume,1);output.setVolume(NaN);assert.equal(media[2].volume,.85);
  output.stop();assert.equal(output.state.status,'stopped');assert.ok(media.every(audio=>audio.src===undefined));output.reset();assert.equal(output.state.revealed,0);
  output.play(lines);const last=media.at(-2);output.dispose();output.dispose();const after=changes.length;last.event('ended');output.play(lines);assert.equal(changes.length,after);
  // Promise rejection belongs only to its active token.
  const audio=new Media();let reject;audio.play=()=>new Promise((_,failed)=>{reject=failed;});
  const rejected=new RecordedVoiceOutput(manifest,()=>audio,()=>{});rejected.play([lines[1]]);rejected.stop();reject(new Error('late'));await Promise.resolve();assert.equal(rejected.state.status,'stopped');rejected.dispose();
});

test('missing/outdated assets, denied playback, decode errors, interruptions and startup stalls fail honestly',async context=>{
  context.mock.timers.enable({apis:['setTimeout']});
  const {output,media}=harness();output.play([{speaker:'Receptionist',text:'Not recorded',id:'unknown'}]);assert.equal(output.state.status,'error');assert.equal(media.length,0);assert.match(output.state.message,/Browser voice fallback/);
  output.play([{...lines[1],text:'Changed source'}]);assert.equal(output.state.status,'error');
  output.play(lines);context.mock.timers.tick(12000);assert.equal(output.state.status,'error');assert.equal(output.state.revealed,6);
  output.play(lines);media.at(-2).event('playing');context.mock.timers.tick(60000);assert.equal(output.state.status,'speaking');media.at(-2).event('error');assert.equal(output.state.status,'error');
  output.play(lines);media.at(-2).event('abort');assert.equal(output.state.status,'error');output.dispose();
  const rejected=new RecordedVoiceOutput(manifest,()=>{const audio=new Media();audio.rejection=true;return audio;},()=>{});rejected.play(lines);await Promise.resolve();assert.equal(rejected.state.status,'error');assert.equal(rejected.state.active,-1);rejected.dispose();
});

test('manifest validation rejects external URLs, traversal, invalid timing and incomplete entries',()=>{
  assert.throws(()=>recordingManifest(null));assert.throws(()=>recordingManifest({...manifest,entries:{}}));
  for(const patch of [{path:'https://external.example/voice.mp3'},{path:'/audio/receptionist/../../voice.mp3'},{duration:NaN},{duration:0},{sha256:'bad'},{text:''},{id:'other'}]) {
    const copy=structuredClone(manifest);Object.assign(copy.entries['check'],patch);assert.throws(()=>recordingManifest(copy));
  }
});
