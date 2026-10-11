// Local static media contract checks; no browser/audio presentation claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import http from 'node:http';
const port=process.argv[2]||'3103',origin=`http://127.0.0.1:${port}`,results=[];
// Native HTTP preserves the conditional request exactly; Node fetch adds a
// no-cache header to explicit validators, forcing a 200 instead of fresh 304.
const get=(path,headers={})=>new Promise((resolve,reject)=>{
  const start=performance.now();const request=http.get(origin+path,{headers},res=>{
    const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({response:{status:res.statusCode,headers:{get:key=>res.headers[key]??null}},data:Buffer.concat(chunks),ms:performance.now()-start}));
  });request.setTimeout(15000,()=>request.destroy(new Error('HTTP timeout')));request.on('error',reject);
});
const {response,data}=await get('/audio/receptionist/manifest.json');assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/application\/json/);assert.doesNotMatch(response.headers.get('cache-control'),/immutable/);
const manifest=JSON.parse(data);results.push({name:'lazy manifest JSON revalidates',status:200,bytes:data.length,cacheControl:response.headers.get('cache-control'),passed:true});
for(const entry of Object.values(manifest.entries)) {
  const result=await get(entry.path);assert.equal(result.response.status,200);assert.match(result.response.headers.get('content-type'),/audio\/mpeg/);assert.match(result.response.headers.get('cache-control'),/max-age=31536000, immutable/);assert.equal(result.data.length,entry.bytes);assert.equal(crypto.createHash('sha256').update(result.data).digest('hex'),entry.sha256);
  results.push({name:entry.id,status:200,bytes:result.data.length,ms:result.ms,passed:true});
}
const entry=Object.values(manifest.entries)[0],range=await get(entry.path,{Range:'bytes=0-1023'});assert.equal(range.response.status,206);assert.equal(range.data.length,1024);assert.match(range.response.headers.get('content-range'),/^bytes 0-1023\//);results.push({name:'mobile seeking supports byte ranges',status:206,passed:true});
const cached=await get(entry.path,{'If-None-Match':(await get(entry.path)).response.headers.get('etag')});assert.equal(cached.response.status,304);results.push({name:'warm recording responds 304 to ETag',status:304,passed:true});
const missing=await get('/audio/receptionist/v1-missing-000000000000.mp3');assert.equal(missing.response.status,404);results.push({name:'missing recording is a genuine 404',status:404,passed:true});
const root=await get('/');assert.doesNotMatch(root.data.toString(),/receptionist\/manifest|audio\/receptionist\/v1-|<audio|rel="preload"[^>]*as="audio"/);results.push({name:'homepage does not preload recordings or manifest',passed:true});
const report={capturedAt:new Date().toISOString(),methodology:'Local compiled HTTP media byte/cache/range checks. No browser playback, paint, GPU or listening measurement.',results};fs.writeFileSync('performance/phase6-audio-http.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
