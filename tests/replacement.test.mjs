import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { INQUIRY_RELEASE_SENDING_ENABLED } from '../src/lib/inquiry-release.ts';
import { configuredInquiryAdapter } from '../src/lib/inquiry-delivery.ts';
import { emailClientAdapter } from '../src/lib/inquiry-server.ts';

test('replacement uses Next build and output without legacy routing or backend', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json'));
  assert.equal(config.framework, 'nextjs');
  assert.equal(config.installCommand, 'npm ci');
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(config.outputDirectory, '.next');
  assert.deepEqual(config.rewrites, []);
  for (const file of ['index.html', 'vite.config.js', '3d-experience', 'api', 'lib', 'admin', 'database', '.htaccess']) assert.equal(fs.existsSync(file), false, file);
  assert.match(fs.readFileSync('next.config.ts', 'utf8'), /process\.env\.VERCEL === "1" \? "\.next"/);
});

test('release cannot send even when hosting inherits fully configured email credentials', () => {
  assert.equal(INQUIRY_RELEASE_SENDING_ENABLED, false);
  const inherited = { INQUIRY_DELIVERY_MODE:'resend', RESEND_API_KEY:'fictional-test-key', INQUIRY_FROM:'hello@example.com', INQUIRY_VERIFIED_SENDER_DOMAIN:'example.com', INQUIRY_ABUSE_URL:'https://gate.example.com', INQUIRY_ABUSE_TOKEN:'fictional-token', INQUIRY_ABUSE_SALT:'a'.repeat(32) };
  const adapter = configuredInquiryAdapter({...inherited, INQUIRY_DELIVERY_MODE: INQUIRY_RELEASE_SENDING_ENABLED ? inherited.INQUIRY_DELIVERY_MODE : 'disabled'}, () => { throw new Error('Network is forbidden'); });
  assert.equal(adapter, emailClientAdapter);
  const route = fs.readFileSync('src/app/api/inquiry/submit/route.ts', 'utf8');
  assert.match(route, /INQUIRY_RELEASE_SENDING_ENABLED \? process\.env\.INQUIRY_DELIVERY_MODE : "disabled"/);
});
