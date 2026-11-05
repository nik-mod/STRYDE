import test from 'node:test';
import assert from 'node:assert/strict';
import { anatomyTour, anatomyCamera, ANATOMY_DETAIL_PROGRESS, ANATOMY_STOPS } from '../design/motion/anatomy-tour.mjs';
import { materialOrbit, projectMaterialOrbit } from '../design/motion/material-orbit.mjs';
test('Drift directs five different details and returns to its full shot',()=>{
 const views=ANATOMY_DETAIL_PROGRESS.map(anatomyTour);
 assert.deepEqual(views.map(v=>v.active),[0,1,2,3,4]);
 assert(views[2].focusY<-.3 && views[2].focusX>.4);
 assert(views[3].rotationX < -1);assert(views[4].rotationX>.9);
 for(const key of ['rotationX','rotationY','rotationZ','focusX','focusY','focusZ','zoom']) assert.equal(anatomyTour(0)[key],anatomyTour(1)[key]);
 for(const [at] of ANATOMY_STOPS.slice(1,-1)) for(const key of ['rotationX','rotationY','rotationZ','focusX','focusY','focusZ','zoom']) assert(Math.abs(anatomyTour(at-1e-6)[key]-anatomyTour(at+1e-6)[key])<1e-8);
});
test('detail camera contains every hull point even at maximum zoom',()=>{
 const hull=[{x:-1.5,y:.65,z:.4},{x:1.1,y:-.8,z:.6},{x:.3,y:.9,z:-.2}];
 const tangent=Math.tan(32*Math.PI/360);
 for(const aspect of [1.2,2.7,4.5])for(const zoom of [1,1.18,1.5,1.95]){
  const z=anatomyCamera(aspect,zoom,hull);
  for(const p of hull){assert(Math.abs(p.x/((z-p.z)*tangent*aspect))<=.900001);assert(Math.abs((p.y-.04)/((z-p.z)*tangent))<=.900001);}
 }
});
test('orbit is deterministic through 601 forward and reverse samples',()=>{
 const ps=Array.from({length:601},(_,i)=>i/600);assert.deepEqual(ps.map(materialOrbit),ps.toReversed().map(materialOrbit).reverse());
 assert.deepEqual([0,.5,1].map(p=>materialOrbit(p).active),[0,1,2]);
 for(const p of ps)for(const item of materialOrbit(p).items){assert(Math.abs((item.x/2.35)**2+((item.z+1.8)/1.8)**2-1)<1e-9);for(const [w,h] of [[878,560],[820,435]]){const f=projectMaterialOrbit(item,w,h);assert(f.width>w*.2);assert(f.x-f.width/2>0 && f.x+f.width/2<w);}}
});
