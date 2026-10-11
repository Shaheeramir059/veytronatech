import http from 'node:http';
import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
const port = process.argv[2] || '3102', origin = `http://127.0.0.1:${port}`;
const example = {fullName:'Local Test',email:'test@example.com',company:'',service:'voice',description:'Local validation check only. This draft will not be sent.',budget:'',intent:'demo',website:''};
const cases = [
  {name:'valid inquiry prepares email-client draft only',body:example,expected:200},
  {name:'invalid email returns field error',body:{...example,email:'invalid'},expected:422},
  {name:'honeypot rejects automated inquiry',body:{...example,website:'spam'},expected:400},
  {name:'cross-origin request rejected',body:example,headers:{Origin:'https://other.example'},expected:403},
  {name:'oversized body rejected',body:{description:'x'.repeat(25_000)},expected:413},
  {name:'non-JSON body rejected',body:example,headers:{'Content-Type':'text/plain'},expected:415},
  {name:'malformed JSON rejected',raw:'{invalid',expected:400},
];
const results=[];
for(const sample of cases) {
  const payload=sample.raw ?? JSON.stringify(sample.body);
  const result=await new Promise((resolve,reject)=>{
    const started=performance.now();
    const request=http.request(`${origin}/api/inquiry/prepare`,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'Content-Length':Buffer.byteLength(payload),...sample.headers}},response=>{
      const chunks=[]; response.on('data',chunk=>chunks.push(chunk)); response.on('end',()=>resolve({status:response.statusCode,ms:performance.now()-started,cacheControl:response.headers['cache-control'],body:JSON.parse(Buffer.concat(chunks).toString())}));
    });
    request.setTimeout(15_000,()=>request.destroy(new Error('API timeout'))); request.on('error',reject); request.end(payload);
  });
  assert.equal(result.status,sample.expected,sample.name); assert.equal(result.cacheControl,'no-store');
  if(result.status===200) {assert.equal(result.body.mode,'email-client');assert.equal(result.body.sent,undefined);assert.ok(result.body.mailto.startsWith('mailto:veytronatech@gmail.com?'));}
  if(result.status===422) assert.ok(result.body.errors.email);
  results.push({name:sample.name,status:result.status,ms:result.ms,cacheControl:result.cacheControl,passed:true});
}
const result={capturedAt:new Date().toISOString(),methodology:'Compiled production API HTTP checks using fictional test input. No browser, email application or delivery provider invoked.',results};
fs.mkdirSync('performance',{recursive:true}); fs.writeFileSync('performance/phase4-api.json',JSON.stringify(result,null,2)); console.log(JSON.stringify(result,null,2));
const styles=fs.readdirSync('.next/static/css').map(file=>{const data=fs.readFileSync('.next/static/css/'+file);return {file,bytes:data.length,gzipBytes:zlib.gzipSync(data).length};});
fs.writeFileSync('performance/phase4-assets.json',JSON.stringify({methodology:'Production CSS file sizes only; not browser network, paint or frame performance.',styles},null,2));
