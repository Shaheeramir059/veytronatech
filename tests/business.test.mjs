import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server.js';
import { SERVICES, PROJECTS, SERVICE_OPTIONS, safeDemoUrl } from '../src/lib/business-data.ts';
import { SCENE_BUSINESS_ACTIONS, serviceRequest, businessTitle } from '../src/lib/business-navigation.ts';
import { initialWorkflow, workflowReducer, workflowOutput, initialVoice, voiceReducer, voiceConversation } from '../src/lib/demo-motion.ts';
import { inquirySchema, inquiryErrors, prepareEmail, CONTACT_EMAIL } from '../src/lib/inquiry.ts';
import { createInquiryHandler, createAttemptLimiter, MAX_INQUIRY_BYTES } from '../src/lib/inquiry-server.ts';
import { loadComponent } from './helpers/component.mjs';

const valid = { fullName:'Ada Example',email:'ada@example.com',company:'',service:'websites',description:'I would like a responsive website for a small business.',budget:'',intent:'project',website:'' };
const request = (data,headers={}) => new Request('http://localhost:3001/api/inquiry/prepare', { method:'POST',headers:{'Content-Type':'application/json',origin:'http://localhost:3001',...headers},body:JSON.stringify(data) });

test('all scene actions and service CTAs resolve to existing views and valid inquiry services', () => {
  assert.equal(SCENE_BUSINESS_ACTIONS.length,6);
  for (const action of SCENE_BUSINESS_ACTIONS) assert.ok(businessTitle(action.view));
  for (const service of SERVICES) {
    assert.ok(service.benefits.length >= 3 && service.benefits.length <= 5);
    assert.ok(service.offerings.length >= 5);
    const target = serviceRequest(service.id);
    assert.equal(target.view,'inquiry'); assert.equal(target.service,service.id);
    assert.ok(SERVICE_OPTIONS.some(option => option.id === target.service));
  }
});
test('portfolio covers all five categories without fabricated clients/results or unconfigured links', () => {
  assert.equal(new Set(PROJECTS.map(project => project.id)).size,5);
  assert.equal(new Set(PROJECTS.map(project => project.category)).size,5);
  PROJECTS.forEach(project => {
    assert.equal(project.status,'Concept Demo'); assert.ok(project.challenge); assert.ok(project.approach.length);
    assert.equal(project.demoUrl,undefined); assert.equal(project.video,undefined);
    assert.ok(SERVICE_OPTIONS.some(option => option.id === project.service));
    if (project.verifiedTechnologies.length) assert.ok(project.verification);
  });
  for (const unsafe of ['javascript:alert(1)','http://example.com','//example.com','/\\example.com','https://user:password@example.com','not-a-url']) assert.equal(safeDemoUrl(unsafe),undefined);
  assert.equal(safeDemoUrl('/#intro'),'/#intro'); assert.equal(safeDemoUrl('https://example.com/demo'),'https://example.com/demo');
});
test('workflow start, pause, inspect, manual stepping and replay are deterministic and stop at completion', () => {
  let state = workflowReducer(initialWorkflow,{type:'start',automatic:true});
  const trail = [];
  for (let i=0;i<5;i++) { trail.push(state); state=workflowReducer(state,{type:'next'}); }
  assert.equal(state.step,4); assert.equal(state.running,false);
  assert.deepEqual(workflowReducer(state,{type:'start',automatic:true}),trail[0]);
  assert.equal(workflowReducer(trail[0],{type:'pause'}).running,false);
  assert.equal(workflowReducer(trail[0],{type:'inspect',step:3}).selected,3);
  assert.equal(workflowReducer(trail[0],{type:'inspect',step:3}).step,0);
  assert.equal(workflowReducer(trail[0],{type:'inspect',step:NaN}).selected,0);
  const manual = workflowReducer(initialWorkflow,{type:'start',automatic:false});
  assert.equal(manual.running,false);
  const later = workflowReducer(state,{type:'configure',interest:'Voice',timing:'Exploring'});
  assert.equal(later.step,-1); assert.match(workflowOutput(later,1),/later check-in/);
  assert.notEqual(workflowOutput(later,3),workflowOutput(initialWorkflow,3));
});
test('voice simulation retains draft status, supports unavailable options/handoff and resets without side effects', () => {
  let state = voiceReducer(initialVoice,{type:'start'});
  for (let i=0;i<10;i++) state=voiceReducer(state,{type:'next'});
  let view = voiceConversation(state);
  assert.equal(state.turn,6); assert.equal(view.turns.length,6); assert.equal(view.available,true); assert.equal(view.staffReady,true);
  assert.match(view.status,/Draft/); assert.ok(view.turns.every(turn => !/reservation (?:is )?confirmed/i.test(turn.text)));
  const handed = voiceReducer(state,{type:'handoff'});
  assert.equal(voiceConversation(handed).status,'Human review needed'); assert.deepEqual(voiceReducer(handed,{type:'next'}),handed);
  assert.equal(voiceReducer(handed,{type:'reset'}).turn,0);
  state=voiceReducer(state,{type:'configure',guests:8,time:'18:30'});
  for(let i=0;i<6;i++) state=voiceReducer(state,{type:'next'});
  view=voiceConversation(state); assert.equal(view.available,false); assert.match(view.status,/Human review/);
  assert.equal(voiceReducer(state,{type:'configure',guests:NaN,time:'19:00'}).guests,4);
});
test('Zod requires meaningful fields, trims input, rejects invalid services/budgets/extra fields and returns field errors', () => {
  const parsed = inquirySchema.parse({...valid,fullName:'  Ada Example  ',company:undefined});
  assert.equal(parsed.fullName,'Ada Example'); assert.equal(parsed.company,'');
  for (const change of [{fullName:' '},{email:'not-email'},{email:'x@example.com\r\nBCC:bad@example.com'},{description:'short'},{description:'x'.repeat(4001)},{service:'unknown'},{budget:'unknown'},{extra:'not accepted'}]) assert.equal(inquirySchema.safeParse({...valid,...change}).success,false);
  const failed=inquirySchema.safeParse({...valid,email:'bad',description:''});
  assert.equal(failed.success,false); assert.ok(inquiryErrors(failed.error).email); assert.ok(inquiryErrors(failed.error).description);
});
test('email draft uses existing contact address and encodes user text as a body, with no injected recipients', () => {
  assert.equal(CONTACT_EMAIL,'veytronatech@gmail.com');
  const data=inquirySchema.parse({...valid,description:'An idea with &bcc=bad@example.com and café / 中文.',intent:'demo',service:'voice'});
  const draft=prepareEmail(data), url=new URL(draft.mailto);
  assert.equal(draft.mode,'email-client'); assert.equal(url.pathname,CONTACT_EMAIL);
  assert.equal(url.searchParams.get('bcc'),null); assert.match(url.searchParams.get('body'),/&bcc=bad@example.com/);
  assert.match(url.searchParams.get('subject'),/AI demo request/); assert.match(url.searchParams.get('body'),/中文/);
});
test('actual route prepares a draft only and returns safe uncached validation errors', async () => {
  const {POST}=await loadComponent('src/app/api/inquiry/prepare/route.ts');
  const okay=await POST(request(valid)); assert.equal(okay.status,200); assert.equal(okay.headers.get('cache-control'),'no-store');
  const body=await okay.json(); assert.equal(body.mode,'email-client'); assert.equal(body.sent,undefined); assert.ok(body.mailto.startsWith(`mailto:${CONTACT_EMAIL}?`));
  const bad=await POST(request({...valid,email:'bad'})); assert.equal(bad.status,422); assert.ok((await bad.json()).errors.email);
});
test('same-origin validation handles actual NextRequest loopback normalization while rejecting mismatched Host/Origin', async () => {
  const handler=createInquiryHandler();
  const make=origin=>new NextRequest('http://127.0.0.1:3001/api/inquiry/prepare',{method:'POST',headers:{host:'127.0.0.1:3001',origin,'Content-Type':'application/json'},body:JSON.stringify(valid)});
  assert.equal(new URL(make('http://127.0.0.1:3001').url).hostname,'localhost');
  assert.equal((await handler(make('http://127.0.0.1:3001'))).status,200);
  assert.equal((await handler(make('http://localhost:3001'))).status,403);
});
test('handler rejects cross-origin, honeypot, malformed/oversized content, and does not call adapter for bad input', async () => {
  let calls=0; const handler=createInquiryHandler({async prepare(data){ calls++; return prepareEmail(data); }});
  assert.equal((await handler(request(valid,{origin:'https://other.example'}))).status,403);
  assert.equal((await handler(request({...valid,website:'spam'}))).status,400);
  assert.equal((await handler(request(valid,{'Content-Type':'text/plain'}))).status,415);
  assert.equal((await handler(new Request('http://localhost:3001/api/inquiry/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'}))).status,400);
  assert.equal((await handler(request({description:'x'.repeat(MAX_INQUIRY_BYTES)}))).status,413);
  assert.equal((await handler(request(valid,{'content-length':String(MAX_INQUIRY_BYTES+1)}))).status,413);
  assert.equal(calls,0);
  const accepted=await handler(request(valid)); assert.equal(accepted.status,200); assert.equal(calls,1);
});
test('abuse limit is bounded, returns retry timing, resets, and provider failure never reports success', async () => {
  let time=0; const limit=createAttemptLimiter(2,60_000,()=>time), handler=createInquiryHandler(undefined,limit);
  assert.equal((await handler(request(valid))).status,200); assert.equal((await handler(request(valid))).status,200);
  const blocked=await handler(request(valid)); assert.equal(blocked.status,429); assert.equal(blocked.headers.get('retry-after'),'60');
  time=60_001; assert.equal((await handler(request(valid))).status,200);
  const failure=createInquiryHandler({async prepare(){throw new Error('private provider failure');}});
  const response=await failure(request(valid)); assert.equal(response.status,503); assert.doesNotMatch(await response.text(),/private provider failure/);
});
test('actual initial demo/form/preview markup exposes accessible controls and accurate simulation/delivery labels', async () => {
  const {AutomationDemo,VoiceDemo}=await loadComponent('src/components/business/Demos.tsx');
  const {default:InquiryForm}=await loadComponent('src/components/business/InquiryForm.tsx');
  const {WebsitePreview,SpatialPreview}=await loadComponent('src/components/business/Previews.tsx');
  const noop=()=>{};
  const voice=renderToStaticMarkup(React.createElement(VoiceDemo,{onNavigate:noop}));
  assert.match(voice,/Interactive Demo/); assert.match(voice,/Not confirmed/); assert.match(voice,/Show human handoff/); assert.doesNotMatch(voice,/<canvas|<audio/);
  const workflow=renderToStaticMarkup(React.createElement(AutomationDemo,{onNavigate:noop}));
  assert.match(workflow,/Start/); assert.match(workflow,/Next step/); assert.equal((workflow.match(/aria-pressed=/g)||[]).length,5);
  const form=renderToStaticMarkup(React.createElement(InquiryForm,{request:{view:'inquiry',service:'voice',intent:'demo'}}));
  assert.match(form,/Submit AI Demo Request/); assert.match(form,/does not store inquiry contents/);
  for(const name of ['fullName','email','company','service','budget','description','website']) assert.match(form,new RegExp(`name="${name}"`));
  assert.match(form,/tabindex="-1"/); assert.match(form,/mailto:veytronatech@gmail.com/);
  assert.match(renderToStaticMarkup(React.createElement(WebsitePreview)),/Mobile/);
  assert.match(renderToStaticMarkup(React.createElement(SpatialPreview)),/Atmosphere/);
});
