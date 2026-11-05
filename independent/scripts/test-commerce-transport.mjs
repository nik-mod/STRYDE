import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'storefront/package.json'));
const {build}=require('esbuild');
const dir=await mkdtemp(resolve(tmpdir(),'stryde-commerce-test-'));
const filename=resolve(dir,'transport.mjs');
// Test the actual server module outside Next's runtime boundary marker.
await build({entryPoints:[resolve(root,'storefront/src/lib/medusa.ts')],outfile:filename,bundle:true,platform:'node',format:'esm',plugins:[{name:'server-marker',setup(build){build.onResolve({filter:/^server-only$/},()=>({path:'server-only',namespace:'test'}));build.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export {};'}));}}]});
const {medusa,CommerceError}=await import(pathToFileURL(filename));
test('connection failures stay a real 503 with bounded diagnostics, not a console-error overlay',async()=>{
  const old={url:process.env.MEDUSA_BACKEND_URL,key:process.env.MEDUSA_PUBLISHABLE_KEY,fetch:globalThis.fetch,error:console.error,warn:console.warn};
  const errors=[],warnings=[];
  try {
    process.env.MEDUSA_BACKEND_URL='http://127.0.0.1:65534'; process.env.MEDUSA_PUBLISHABLE_KEY='local-test-key';
    globalThis.fetch=async()=>{throw new TypeError('simulated unavailable backend');};
    console.error=(...values)=>errors.push(values); console.warn=(...values)=>warnings.push(values);
    for(let i=0;i<2;i++)await assert.rejects(()=>medusa('/products'),e=>e instanceof CommerceError&&e.status===503&&/temporarily unavailable/.test(e.message));
    assert.equal(errors.length,0); assert.equal(warnings.length,1);
    assert.equal(JSON.parse(warnings[0][0]).event,'commerce.connection.failed');
    assert(!JSON.stringify(warnings).includes('local-test-key'));
  } finally {Object.assign(globalThis,{fetch:old.fetch});console.error=old.error;console.warn=old.warn;if(old.url===undefined)delete process.env.MEDUSA_BACKEND_URL;else process.env.MEDUSA_BACKEND_URL=old.url;if(old.key===undefined)delete process.env.MEDUSA_PUBLISHABLE_KEY;else process.env.MEDUSA_PUBLISHABLE_KEY=old.key;}
});
test('unexpected HTTP errors keep their diagnostic and successful requests return real data',async()=>{
  const old={url:process.env.MEDUSA_BACKEND_URL,key:process.env.MEDUSA_PUBLISHABLE_KEY,fetch:globalThis.fetch,error:console.error};
  const errors=[];
  try {
    process.env.MEDUSA_BACKEND_URL='http://127.0.0.1:9000';process.env.MEDUSA_PUBLISHABLE_KEY='local-test-key';console.error=(...v)=>errors.push(v);
    globalThis.fetch=async()=>new Response('{}',{status:403});
    await assert.rejects(()=>medusa('/products'),e=>e instanceof CommerceError&&e.status===403);
    assert.equal(errors.length,1);
    globalThis.fetch=async()=>Response.json({products:[{id:'test-product'}]});
    assert.deepEqual(await medusa('/products'),{products:[{id:'test-product'}]});
  } finally {globalThis.fetch=old.fetch;console.error=old.error;if(old.url===undefined)delete process.env.MEDUSA_BACKEND_URL;else process.env.MEDUSA_BACKEND_URL=old.url;if(old.key===undefined)delete process.env.MEDUSA_PUBLISHABLE_KEY;else process.env.MEDUSA_PUBLISHABLE_KEY=old.key;}
});
