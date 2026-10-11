import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadComponent } from './helpers/component.mjs';
import { siteOrigin } from '../src/lib/site-config.ts';
import { SERVICES, PROJECTS } from '../src/lib/business-data.ts';
test('canonical configuration accepts an explicit HTTPS origin and never invents a domain',()=>{
  assert.equal(siteOrigin(''),undefined); assert.equal(siteOrigin('not-a-url'),undefined);
  for(const value of ['http://example.com','https://person:secret@example.com','https://example.com/path','https://example.com?query=1','https://example.com#hash']) assert.equal(siteOrigin(value),undefined);
  assert.equal(siteOrigin('https://example.com/'),'https://example.com');
});
test('server-rendered service content has one main heading, truthful offerings and usable direct contact without WebGL',async()=>{
  const {default:Page}=await loadComponent('src/app/services/page.tsx'); const html=renderToStaticMarkup(React.createElement(Page));
  assert.equal((html.match(/<h1/g)||[]).length,1); assert.equal((html.match(/<article/g)||[]).length,3);
  for(const service of SERVICES) {assert.ok(html.includes(service.name));assert.ok(html.includes(service.overview));}
  assert.match(html,/mailto:veytronatech@gmail.com/); assert.match(html,/application\/ld\+json/); assert.doesNotMatch(html,/<canvas|aggregateRating|telephone|streetAddress/);
});
test('mobile menu and voice initial HTML expose keyboard controls with no automatic audio or open navigation',async()=>{
  const {default:Menu}=await loadComponent('src/components/MobileNavigation.tsx'); const menu=renderToStaticMarkup(React.createElement(Menu,{onNavigate:()=>{}}));
  assert.match(menu,/aria-expanded="false"/); assert.match(menu,/id="mobile-navigation-panel"[^>]*hidden=""/); assert.match(menu,/Read about our services/);
  const {VoiceDemo}=await loadComponent('src/components/business/Demos.tsx'); const voice=renderToStaticMarkup(React.createElement(VoiceDemo,{onNavigate:()=>{}}));
  for(const label of ['Audible Interactive Demo — Simulated Conversation','Play Voice Demo','Pause','Resume','Stop','Replay audio','Natural prerecorded voice','Browser voice fallback','Volume','Conversation scenario','Read full transcript']) assert.ok(voice.includes(label),label);
  assert.doesNotMatch(voice,/wave-active|turn-speaking|autoplay/);
});
test('all five portfolio concepts have verified local implementation descriptions while media remains optional',()=>{
  assert.equal(PROJECTS.length,5);
  for(const project of PROJECTS) {assert.equal(project.status,'Concept Demo');assert.ok(project.verifiedTechnologies.length);assert.ok(project.verification);assert.equal(project.demoUrl,undefined);assert.equal(project.thumbnail,undefined);assert.equal(project.video,undefined);}
});
