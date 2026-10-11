import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { ribbonGeometry, acquireRibbon } from '../src/lib/hero-geometry.ts';

const [label = 'baseline', port = '3100'] = process.argv.slice(2);
const samples = [];
for (let i = 0; i < 6; i++) {
  samples.push(await new Promise((resolve, reject) => {
    const start = performance.now();
    const request = http.get(`http://127.0.0.1:${port}/`, response => {
      const ttfb = performance.now() - start;
      const chunks = [];
      let firstChunk;
      response.on('data', data => { firstChunk ??= performance.now() - start; chunks.push(data); });
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        resolve({ ttfbMs: ttfb, firstHtmlChunkMs: firstChunk, totalMs: performance.now() - start,
          status: response.statusCode, htmlBytes: Buffer.byteLength(body), hasHeadline: body.includes('Beyond'),
          hasBrand: body.includes('VEYTRONA'), hasCTA: body.includes('Explore our world'),
          scripts: [...body.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]) });
      });
    });
    request.setTimeout(60000, () => request.destroy(new Error('HTTP timeout')));
    request.on('error', reject);
  }));
}
const geometry = {};
for (const [preset, segments] of [['desktop', 160], ['mobile', 72]]) {
  const timings = [];
  for (let run = 0; run < 31; run++) {
    const start = performance.now();
    const meshes = Array.from({ length: 6 }, (_, index) => ribbonGeometry(index, segments));
    timings.push(performance.now() - start);
    meshes.forEach(mesh => mesh.dispose());
  }
  const warm = timings.slice(1).sort((a,b) => a-b);
  const keep = Array.from({ length: 6 }, (_, index) => acquireRibbon(index, segments));
  const hits = [];
  for (let run = 0; run < 31; run++) {
    const start = performance.now();
    const leases = Array.from({ length: 6 }, (_, index) => acquireRibbon(index, segments));
    hits.push(performance.now() - start);
    leases.forEach(lease => lease.release());
  }
  keep.forEach(lease => lease.release());
  hits.sort((a,b) => a-b);
  geometry[preset] = { coldSixRibbonsMs: timings[0], warmMedianMs: warm[Math.floor(warm.length / 2)], warmP95Ms: warm[Math.floor(warm.length * .95)], cachedSixLeaseMedianMs: hits[15] };
}
const dist = process.env.VEYTRONA_DIST_DIR || '.next';
const chunksPath = `${dist}/static/chunks`;
const bundles = [];
function walk(folder) {
  if (!fs.existsSync(folder)) return;
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const filename = path.join(folder, entry.name);
    if (entry.isDirectory() && entry.name !== 'fallback') walk(filename);
    else if (entry.name.endsWith('.js')) {
      const data = fs.readFileSync(filename);
      bundles.push({ file: filename.replaceAll('\\', '/'), bytes: data.length, gzipBytes: zlib.gzipSync(data).length });
    }
  }
}
walk(chunksPath);
const loadablePath = `${dist}/react-loadable-manifest.json`;
const loadable = fs.existsSync(loadablePath) ? JSON.parse(fs.readFileSync(loadablePath)) : {};
const dynamicEntries = Object.fromEntries(Object.entries(loadable).map(([key, entry]) => [key, {
  files: entry.files,
  rawBytes: entry.files.reduce((sum, filename) => sum + (bundles.find(b => b.file === `${dist}/${filename}`)?.bytes || 0), 0),
  gzipBytes: entry.files.reduce((sum, filename) => sum + (bundles.find(b => b.file === `${dist}/${filename}`)?.gzipBytes || 0), 0),
}]));
const result = { label, capturedAt: new Date().toISOString(), runtime: process.version,
  methodology: 'First request after process start (server cold), then five requests (server warm). Local HTTP, not browser navigation; no client cache, GPU, paint, or FPS measurements.',
  samples, geometry, dynamicEntries, bundles: bundles.sort((a,b) => b.bytes-a.bytes),
  unavailable: ['Canvas mount', 'WebGL context duration', 'shader compilation', 'PMREM GPU duration', 'first visible 3D frame', 'browser cold/warm navigation', 'FPS/frame times'] };
fs.mkdirSync('performance', { recursive: true });
fs.writeFileSync(`performance/${label}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ label, cold: samples[0], warmMedianTtfbMs: samples.slice(1).map(s=>s.ttfbMs).sort((a,b)=>a-b)[2], geometry, largestBundles: result.bundles.slice(0,5) }, null, 2));
