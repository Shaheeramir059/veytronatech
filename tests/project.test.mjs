import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sceneSource = fs.readFileSync(path.join(root, 'src/lib/scenes.ts'), 'utf8');
const experienceSource = fs.readFileSync(path.join(root, 'src/components/CinematicExperience.tsx'), 'utf8');
const worldSource = fs.readFileSync(path.join(root, 'src/components/World.tsx'), 'utf8');

const ids = [...sceneSource.matchAll(/id: "([a-z]+)"/g)].map(match => match[1]);
const hrefs = [...sceneSource.matchAll(/href: "#([a-z]+)"/g)].map(match => match[1]);

test('six distinct scenes in expected story order', () => {
  assert.deepEqual(ids, ['intro', 'websites', 'automation', 'voice', 'immersive', 'contact']);
  assert.equal(new Set(ids).size, ids.length);
});

test('all section navigation targets exist', () => {
  for (const href of hrefs) assert.ok(ids.includes(href), `Missing #${href}`);
});

test('persistent WebGL canvas and scroll controller exist', () => {
  assert.match(experienceSource, /<World progress=\{progress\}/);
  assert.match(experienceSource, /ScrollTrigger\.create/);
  assert.match(worldSource, /<Canvas/);
  assert.match(worldSource, /progress\.current/);
  assert.match(worldSource, /camera\.position\.set/);
  assert.match(worldSource, /useFrame/);
});

test('contact CTA is an email link; no live network actions', () => {
  const contactSource = fs.readFileSync(path.join(root, 'src/lib/contact.ts'), 'utf8');
  assert.doesNotMatch(contactSource, /process\.env/);
  assert.match(contactSource, /veytronatech@gmail\.com/);
  assert.match(sceneSource, /mailto:\$\{CONTACT_EMAIL\}/);
  assert.doesNotMatch(experienceSource + worldSource, /fetch\(|axios\.|sendEmail\(/);
});
