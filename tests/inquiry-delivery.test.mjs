import test from 'node:test';
import assert from 'node:assert/strict';
import { inquirySchema, CONTACT_EMAIL } from '../src/lib/inquiry.ts';
import { createInquiryHandler, emailClientAdapter } from '../src/lib/inquiry-server.ts';
import { configuredInquiryAdapter, createDeliveryAdapter, createResendProvider, createSubmissionGuard } from '../src/lib/inquiry-delivery.ts';
const inquiry=inquirySchema.parse({fullName:'Local Test',email:'test@example.com',service:'voice',description:'Discuss a restaurant voice workflow concept, not a real booking.'});
const key='12345678-1234-1234-1234-123456789abc';
const request=(body=inquiry,headers={})=>new Request('http://localhost:3001/api/inquiry/submit',{method:'POST',headers:{origin:'http://localhost:3001','Content-Type':'application/json','Idempotency-Key':key,...headers},body:JSON.stringify(body)});
test('real provider adapter uses verified API shape, fixed recipient, reply-to, bounded request and retry idempotency',async()=>{
  const calls=[]; const provider=createResendProvider({key:'MOCK_ONLY',from:'inquiries@example.com'},async(url,options)=>{calls.push({url,options}); return Response.json({id:'provider-reference'});});
  assert.deepEqual(await provider.send(inquiry,key),{state:'accepted',reference:'provider-reference'}); await provider.send(inquiry,key);
  assert.equal(calls[0].url,'https://api.resend.com/emails'); assert.ok(calls[0].options.signal);
  assert.equal(calls[0].options.headers['Idempotency-Key'],calls[1].options.headers['Idempotency-Key']);
  const payload=JSON.parse(calls[0].options.body); assert.deepEqual(payload.to,[CONTACT_EMAIL]); assert.equal(payload.reply_to,inquiry.email); assert.equal(payload.html,undefined); assert.equal(payload.bcc,undefined); assert.ok(payload.text.includes(inquiry.description));
});
test('rejection, malformed acceptance, HTTP 5xx and network timeout never claim delivery',async()=>{
  for(const [transport,state] of [[async()=>Response.json({message:'PRIVATE'},{status:422}),'rejected'],[async()=>Response.json({message:'PRIVATE'},{status:503}),'unknown'],[async()=>Response.json({id:undefined}),'unknown'],[async()=>{throw new Error('PRIVATE with secret');},'unknown']]) {
    const provider=createResendProvider({key:'mock',from:'inquiries@example.com'},transport); assert.deepEqual(await provider.send(inquiry,key),{state});
  }
});
test('actual handler plus mocked delivery reports only provider acceptance and preserves truthful fallback states',async()=>{
  const guard={check:async()=>true};
  for(const receipt of [{state:'accepted',reference:'mock-reference'},{state:'rejected'},{state:'unknown'}]) {
    const handler=createInquiryHandler(createDeliveryAdapter({send:async()=>receipt},guard)); const response=await handler(request()); const result=await response.json();
    assert.equal(response.status,200); assert.equal(response.headers.get('cache-control'),'no-store');
    if(receipt.state==='accepted') {assert.equal(result.mode,'provider'); assert.equal(result.state,'accepted'); assert.equal(result.reference,'mock-reference'); assert.equal(result.delivered,undefined);}
    else {assert.equal(result.mode,'fallback'); assert.equal(result.state,receipt.state); assert.equal(result.draft.mode,'email-client'); assert.equal(result.sent,undefined);}
  }
});
test('guard sends only salted digest, fails closed, and blocks provider before any send',async()=>{
  const calls=[];
  const guard=createSubmissionGuard({url:'https://guard.example/limit',token:'mock',salt:'x'.repeat(32)},async(url,options)=>{calls.push(JSON.parse(options.body));return Response.json({allowed:true});});
  assert.equal(await guard.check(inquiry),true); assert.match(calls[0].key,/^[a-f0-9]{64}$/); assert.equal(JSON.stringify(calls).includes(inquiry.email),false); assert.equal(JSON.stringify(calls).includes(inquiry.description),false);
  let sends=0; const adapter=createDeliveryAdapter({send:async()=>{sends++;return {state:'accepted',reference:'unexpected'};}},{check:async()=>false});
  assert.equal((await adapter.prepare(inquiry,request())).state,'rejected'); assert.equal(sends,0);
  assert.equal(await createSubmissionGuard({url:'https://guard.example',token:'mock',salt:'salt'},async()=>{throw new Error('offline');}).check(inquiry),false);
});
test('missing browser origin/key and bad inputs never reach delivery; credentials alone cannot opt in',async()=>{
  let sends=0; const adapter=createDeliveryAdapter({send:async()=>{sends++;return {state:'accepted',reference:'unexpected'};}},{check:async()=>true}); const handler=createInquiryHandler(adapter);
  for(const headers of [{origin:''},{'Idempotency-Key':'not-a-key'},{origin:'https://hostile.example'}]) {const response=await handler(request(inquiry,headers)); const body=await response.json(); assert.notEqual(body.mode,'provider');}
  for(const body of [{...inquiry,website:'spam'},{...inquiry,email:'invalid'}]) assert.ok((await handler(request(body))).status>=400);
  assert.equal(sends,0); assert.equal(configuredInquiryAdapter({RESEND_API_KEY:'unused',INQUIRY_FROM:'inquiries@example.com'}),emailClientAdapter);
  assert.equal(configuredInquiryAdapter({INQUIRY_DELIVERY_MODE:'resend',RESEND_API_KEY:'unused',INQUIRY_FROM:'inquiries@example.com'}),emailClientAdapter);
  assert.equal(configuredInquiryAdapter({INQUIRY_DELIVERY_MODE:'resend',RESEND_API_KEY:'unused',INQUIRY_FROM:'inquiries@example.com',INQUIRY_ABUSE_URL:'http://insecure.example',INQUIRY_ABUSE_TOKEN:'mock',INQUIRY_ABUSE_SALT:'x'.repeat(32)}),emailClientAdapter);
});
test('fully configured mock integration performs durable gate before provider, and unconfigured form stays draft-only',async()=>{
  const env={INQUIRY_DELIVERY_MODE:'resend',RESEND_API_KEY:'mock',INQUIRY_FROM:'inquiries@example.com',INQUIRY_VERIFIED_SENDER_DOMAIN:'example.com',INQUIRY_ABUSE_URL:'https://guard.example/limit',INQUIRY_ABUSE_TOKEN:'mock',INQUIRY_ABUSE_SALT:'x'.repeat(32)};
  const calls=[]; const adapter=configuredInquiryAdapter(env,async(url)=>{calls.push(url);return Response.json(url.includes('guard.example')?{allowed:true}:{id:'mock-reference'});});
  const result=await (await createInquiryHandler(adapter)(request())).json(); assert.equal(result.mode,'provider'); assert.deepEqual(calls,['https://guard.example/limit','https://api.resend.com/emails']);
  const fallback=await configuredInquiryAdapter({}).prepare(inquiry); assert.equal(fallback.mode,'email-client'); assert.equal(fallback.sent,undefined);
});
