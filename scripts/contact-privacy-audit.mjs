// Audit deployable surfaces, not private development records/cache/server traces.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {CONTACT_EMAIL,inquirySchema,prepareEmail} from '../src/lib/inquiry.ts';
const results=[];
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):[path.join(folder,entry.name)]);}
function inspect(file){
  const data=fs.readFileSync(file),text=data.toString('utf8');
  assert.doesNotMatch(text,/\bshaheer\b|\b03\d{9}\b|(?:\+92|0092)[\d ()-]{8,}|(?:["'=]\s*tel:)|https?:\/\/(?:wa\.me|(?:api|web)\.whatsapp\.com)/i,file);
  // React's "tel:!0" input-type table is not a telephone contact link.
  if(/\.(html|json|svg|xml|txt)$/.test(file))assert.doesNotMatch(text,/"telephone"\s*:|"founder"\s*:/i,file);
  results.push({file:file.replaceAll('\\','/'),bytes:data.length,passed:true});
}
for(const folder of ['src','public','.next/static'])for(const file of walk(folder))inspect(file);
for(const file of walk('.next/server/app').filter(file=>/\.(html|rsc|body|meta)$/.test(file)))inspect(file);
// Embedded audio tags are audited separately from arbitrary decoded binary bytes.
for(const file of walk('public').filter(file=>file.endsWith('.mp3'))){
  const metadata=execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json',file],{encoding:'utf8'});
  assert.doesNotMatch(metadata,/shaheer|(?:\+92|0092)|\b03\d{9}\b|tel:|wa\.me/i,file);
}
const example=inquirySchema.parse({fullName:'Fictional Client',email:'client@example.com',service:'websites',description:'Fictional data for a local automatic submission regression test.'});
const draft=prepareEmail(example);assert.equal(CONTACT_EMAIL,'veytronatech@gmail.com');assert.equal(draft.recipient,CONTACT_EMAIL);assert.match(draft.body,/Hello VeytronaTech/);
const report={capturedAt:new Date().toISOString(),scope:'Public source, all public files and MP3 embedded tags, compiled static chunks/maps, prerendered HTML/RSC/body/meta (including JSON-LD/metadata/images), agency contact template. No browser or audio listening claim. Private development records/cache/traces intentionally excluded.',knownIdentityPatterns:'Known owner first name, Pakistani phone-shaped literals, telephone/WhatsApp contact links. Exact undisclosed phone or other unknown name variants cannot be inferred.',personalInformationFound:0,filesChecked:results.length,publicContact:CONTACT_EMAIL,results};
fs.writeFileSync('performance/contact-privacy-scan.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined},null,2));
