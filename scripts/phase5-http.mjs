import http from 'node:http';
import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
const port=process.argv[2] || '3102', label=process.argv[3] || 'phase5', origin=`http://127.0.0.1:${port}`, results=[];
async function request(path,{body,raw,headers={}}={}) {
  const payload=raw ?? (body ? JSON.stringify(body) : undefined), start=performance.now();
  return new Promise((resolve,reject)=>{
    const req=http.request(origin+path,{method:payload===undefined?'GET':'POST',headers:{Origin:origin,...(payload===undefined?{}:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}),...headers}},res=>{
      const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,data:Buffer.concat(chunks),ms:performance.now()-start}));
    });req.setTimeout(20_000,()=>req.destroy(new Error('Local HTTP timeout')));req.on('error',reject);req.end(payload);
  });
}
const example={fullName:'Local Test',email:'test@example.com',company:'',service:'voice',description:'Local validation only. Server delivery is explicitly disabled for this test.',budget:'',intent:'demo',website:''};
// Start the server with INQUIRY_DELIVERY_MODE=disabled. Never probe a live provider.
const cases=[
  ['unconfigured submit preserves draft fallback',example,{},200],
  ['invalid email', {...example,email:'bad'},{},422],
  ['honeypot', {...example,website:'spam'},{},400],
  ['cross origin',example,{Origin:'https://other.example'},403],
  ['oversized stream',{description:'x'.repeat(25_000)},{},413],
  ['non-JSON MIME',example,{'Content-Type':'text/plain'},415],
];
for(const [name,body,headers,status] of cases) {
  const r=await request('/api/inquiry/submit',{body,headers});assert.equal(r.status,status,name);assert.equal(r.headers['cache-control'],'no-store');
  if(status===200) {const json=JSON.parse(r.data);assert.equal(json.mode,'email-client');assert.equal(json.sent,undefined);assert.equal(json.state,undefined);}
  results.push({name,status:r.status,ms:r.ms,passed:true});
}
for(const [name,path,options,status] of [['malformed JSON','/api/inquiry/submit',{raw:'{bad'},400],['draft endpoint regression','/api/inquiry/prepare',{body:example},200]]) {
  const r=await request(path,options);assert.equal(r.status,status);results.push({name,status:r.status,ms:r.ms,passed:true});
}
const root=await request('/');assert.equal(root.status,200); const html=root.data.toString();
assert.ok(html.includes('Beyond')); assert.ok(html.includes('VEYTRONA')); assert.ok(html.includes('noindex, nofollow'));
assert.doesNotMatch(html,/<link[^>]+rel="canonical"/); assert.doesNotMatch(html,/http:\/\/localhost:3000/);
for(const header of ['content-security-policy','permissions-policy','referrer-policy','x-content-type-options']) assert.ok(root.headers[header]);
assert.equal(root.headers['x-frame-options'],'DENY');results.push({name:'immediate branding, unconfigured canonical/noindex and security headers',status:200,passed:true});
const services=await request('/services'); const content=services.data.toString();assert.equal(services.status,200);
for(const phrase of ['Website Development','AI Automation','AI Voice Agents','What we can build','application/ld+json']) assert.ok(content.includes(phrase));
assert.doesNotMatch(content,/<canvas/);results.push({name:'meaningful server-rendered services without WebGL',status:200,passed:true});
const robots=await request('/robots.txt');assert.match(robots.data.toString(),/Disallow: \/\s/);results.push({name:'unconfigured domain disallows indexing',status:robots.status,passed:true});
const sitemap=await request('/sitemap.xml');assert.equal(sitemap.status,200);assert.doesNotMatch(sitemap.data.toString(),/<loc>/);results.push({name:'unconfigured domain has no invented sitemap URLs',status:200,passed:true});
for(const [path,width,height] of [['/social-image',1200,630],['/apple-icon',180,180]]) {
  const r=await request(path);assert.equal(r.status,200);assert.ok(r.headers['content-type'].includes('image/png'));assert.equal(r.data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(r.data.readUInt32BE(16),width);assert.equal(r.data.readUInt32BE(20),height);
  results.push({name:`code-native PNG ${path}`,status:200,width,height,bytes:r.data.length,passed:true});
}
const icon=await request('/icon.svg');assert.equal(icon.status,200);assert.match(icon.data.toString(),/<svg/);results.push({name:'SVG favicon',status:200,passed:true});
function walk(folder) {return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(folder+'/'+entry.name):[folder+'/'+entry.name]);}
for(const file of walk('.next/static/chunks').filter(file=>file.endsWith('.js'))) assert.doesNotMatch(fs.readFileSync(file,'utf8'),/RESEND_API_KEY|INQUIRY_ABUSE_TOKEN|INQUIRY_ABUSE_SALT|api\.resend\.com/);
results.push({name:'server delivery module/credential keys absent from browser chunks',passed:true});
const styles=fs.readdirSync('.next/static/css').map(file=>{const data=fs.readFileSync('.next/static/css/'+file);return {file,bytes:data.length,gzipBytes:zlib.gzipSync(data).length};});
const report={capturedAt:new Date().toISOString(),methodology:'Compiled local production HTTP and byte checks with sending explicitly disabled. No browser, audio playback, real email or visual/GPU measurement.',results,styles};
fs.mkdirSync('performance',{recursive:true});fs.writeFileSync(`performance/${label}-http.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
