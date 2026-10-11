import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {CONTACT_EMAIL,prepareEmail,inquirySchema} from '../src/lib/inquiry.ts';
import {configuredInquiryAdapter,createSubmissionGuard} from '../src/lib/inquiry-delivery.ts';
import {createInquiryHandler,emailClientAdapter,INQUIRY_READ_TIMEOUT_MS} from '../src/lib/inquiry-server.ts';

const inquiry=inquirySchema.parse({fullName:'Fictional Client',email:'client@example.com',service:'websites',description:'A fictional business website inquiry used only in automated tests.'});
function files(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(folder,entry.name)):[path.join(folder,entry.name)]);}
test('agency contact cannot be replaced by a public deployment variable and templates contain agency identity only',async()=>{
  const before=process.env.NEXT_PUBLIC_CONTACT_EMAIL;process.env.NEXT_PUBLIC_CONTACT_EMAIL='personal@example.com';
  try {assert.equal((await import('../src/lib/contact.ts?privacy-regression')).CONTACT_EMAIL,'veytronatech@gmail.com');}
  finally {if(before===undefined)delete process.env.NEXT_PUBLIC_CONTACT_EMAIL;else process.env.NEXT_PUBLIC_CONTACT_EMAIL=before;}
  const draft=prepareEmail(inquiry);assert.equal(CONTACT_EMAIL,'veytronatech@gmail.com');assert.equal(draft.recipient,CONTACT_EMAIL);assert.match(draft.body,/Hello VeytronaTech,/);assert.match(draft.mailto,/^mailto:veytronatech@gmail\.com\?/);
});
test('public source and assets contain no known owner name, personal phone links or phone-shaped content',()=>{
  for(const file of [...files('src'),...files('public')]){
    const text=fs.readFileSync(file).toString('utf8');
    assert.doesNotMatch(text,/\bshaheer\b|(?:tel:|https?:\/\/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com))|\b03\d{9}\b|(?:\+92|0092)[\d ()-]{8,}/i,file);
  }
});
test('sender-domain acknowledgement is mandatory, mismatched/Gmail domains remain disabled, and only complete mock configuration enables the adapter',()=>{
  const env={INQUIRY_DELIVERY_MODE:'resend',RESEND_API_KEY:'MOCK_ONLY',INQUIRY_FROM:'inquiries@example.com',INQUIRY_VERIFIED_SENDER_DOMAIN:'example.com',INQUIRY_ABUSE_URL:'https://guard.example/limit',INQUIRY_ABUSE_TOKEN:'MOCK_ONLY',INQUIRY_ABUSE_SALT:'x'.repeat(32)};
  const never=async()=>{assert.fail('configuration inspection must never send');};
  for(const patch of [{INQUIRY_VERIFIED_SENDER_DOMAIN:''},{INQUIRY_VERIFIED_SENDER_DOMAIN:'other.example'},{INQUIRY_FROM:'veytronatech@gmail.com',INQUIRY_VERIFIED_SENDER_DOMAIN:'gmail.com'},{INQUIRY_DELIVERY_MODE:'disabled'},{INQUIRY_ABUSE_URL:''}])assert.equal(configuredInquiryAdapter({...env,...patch},never),emailClientAdapter);
  assert.notEqual(configuredInquiryAdapter(env,never),emailClientAdapter);
});
test('durable gate fails closed on malformed, denied, HTTP failure and offline responses without exposing inquiry content',async()=>{
  for(const transport of [async()=>Response.json({allowed:'true'}),async()=>Response.json({allowed:false}),async()=>new Response('invalid'),async()=>Response.json({allowed:true},{status:503}),async()=>{throw new Error('offline');}])assert.equal(await createSubmissionGuard({url:'https://guard.example',token:'mock',salt:'x'.repeat(32)},transport).check(inquiry),false);
});
test('a stalled request body times out, cancels its reader and never reaches the delivery adapter',async context=>{
  context.mock.timers.enable({apis:['setTimeout']});let cancelled=false,calls=0;
  const body=new ReadableStream({cancel(){cancelled=true;}});
  const request=new Request('http://localhost:3001/api/inquiry/submit',{method:'POST',headers:{Origin:'http://localhost:3001','Content-Type':'application/json'},body,duplex:'half'});
  const result=createInquiryHandler({prepare:async()=>{calls++;return prepareEmail(inquiry);}})(request);
  context.mock.timers.tick(INQUIRY_READ_TIMEOUT_MS);const response=await result;assert.equal(response.status,408);assert.equal(cancelled,true);assert.equal(calls,0);assert.equal(response.headers.get('Cache-Control'),'no-store');
});
