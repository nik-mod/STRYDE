import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { writeFile } from 'node:fs/promises';

// A reproducible, hand-authored approximation of the user's reference.
// Units: metres. X points toward heel; Y up; Z toward lateral side.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(data => { this.result=data; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(data => { this.result=`data:${blob.type};base64,${Buffer.from(data).toString('base64')}`; this.onloadend?.(); }); }
};
const scene=new T.Scene();
const shoe=new T.Group(); shoe.name='TN_blue_white_reference_approximation'; scene.add(shoe);
const materials={
 white:new T.MeshStandardMaterial({name:'White satin TPU',color:0xf4f5f2,roughness:.37}),
 leather:new T.MeshStandardMaterial({name:'White leather',color:0xe9eceb,roughness:.67}),
 mesh:new T.MeshStandardMaterial({name:'Blue gradient textile',color:0xffffff,vertexColors:true,roughness:.9}),
 black:new T.MeshStandardMaterial({name:'Black rubber',color:0x15191d,roughness:.87}),
 blue:new T.MeshStandardMaterial({name:'Blue structural support',color:0x0876be,metalness:.18,roughness:.27}),
 air:new T.MeshPhysicalMaterial({name:'Blue tinted Air windows',color:0x3fbed7,metalness:.12,roughness:.12,transmission:.3,thickness:.003,transparent:true,opacity:.8}),
 seam:new T.MeshStandardMaterial({name:'Stitching',color:0xc6d4d7,roughness:1}),
 lace:new T.MeshStandardMaterial({name:'White woven laces',color:0xf8f8f4,roughness:1}),
 lining:new T.MeshStandardMaterial({name:'Padded collar lining',color:0xd3dedf,roughness:1}),
};
const groups={};
for(const name of ['outsole','midsole','upper','laces','insole','heel_support','structural_support']) {const g=new T.Group();g.name=name;shoe.add(g);groups[name]=g;}
function add(geometry,material,group,name){const mesh=new T.Mesh(geometry,material);mesh.name=name;groups[group].add(mesh);return mesh;}
function tube(points,r,mat,group,name,segments=48){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,r,8,false),mat,group,name);}
function ellipsoid(x,y,z,sx,sy,sz,mat,group,name){const m=add(new T.SphereGeometry(1,24,12),mat,group,name);m.position.set(x,y,z);m.scale.set(sx,sy,sz);return m;}
// Cross sections derived from the reference silhouette; toe is negative X.
const sections=[[-.145,.004,.043],[-.137,.030,.049],[-.115,.044,.053],[-.075,.048,.060],[-.035,.046,.076],[.005,.041,.099],[.045,.036,.119],[.077,.034,.120],[.105,.034,.116],[.130,.029,.111],[.145,.013,.094],[.148,.001,.076]];
function cross(x){let i=0;while(i<sections.length-2&&sections[i+1][0]<x)i++;const a=sections[i],b=sections[i+1],t=T.MathUtils.clamp((x-a[0])/(b[0]-a[0]),0,1);return [T.MathUtils.lerp(a[1],b[1],t),T.MathUtils.lerp(a[2],b[2],t)];}
function base(x){return .035+ .008*Math.pow(Math.max(0,(-x-.09)/.058),2);}
function surface(x,angle,offset=0){const [w,h]=cross(x);const s=Math.sin(angle);return [x,base(x)+(h-base(x))*Math.pow(Math.max(0,s),.77)+offset,Math.cos(angle)*(w+offset)];}
const pos=[],cols=[],inds=[],uv=[];const NX=110,NA=56;
for(let i=0;i<=NX;i++){const x=T.MathUtils.lerp(-.145,.148,i/NX);for(let j=0;j<=NA;j++){const a=Math.PI*j/NA;const p=surface(x,a);pos.push(...p);uv.push(i/NX,j/NA);const col=new T.Color().lerpColors(new T.Color(0x21bce7),new T.Color(0x0764b8),T.MathUtils.smoothstep(x,-.1,.14));const weave=1-.045*(.5+.5*Math.sin(i*5.1)*Math.cos(j*4.7));col.multiplyScalar(weave);cols.push(col.r,col.g,col.b);if(i<NX&&j<NA&&!(x>.049&&x<.125&&a>.69&&a<2.44)){const k=i*(NA+1)+j;inds.push(k,k+1,k+NA+1,k+1,k+NA+2,k+NA+1);}}}
const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(cols,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));for(let k=0;k<inds.length;k+=3)[inds[k+1],inds[k+2]]=[inds[k+2],inds[k+1]];geo.setIndex(inds);geo.computeVertexNormals();add(geo,materials.mesh,'upper','Continuous blue textile upper');
// Lofted perimeter bands provide a shaped toe, waist and heel.
function band(name,bottom,top,widthScale,mat,group){const ps=[],ix=[],N=110;for(let i=0;i<=N;i++){const x=T.MathUtils.lerp(-.147,.149,i/N);const w=cross(T.MathUtils.clamp(x,-.145,.148))[0]*widthScale+.001;for(let j=0;j<4;j++){const ys=[bottom(x),bottom(x),top(x),top(x)];const zs=[-w,w,w,-w];ps.push(x,ys[j],zs[j]);}if(i<N)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=a+4,d=b+4;ix.push(a,b,c,b,d,c);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));for(let k=0;k<ix.length;k+=3)[ix[k+1],ix[k+2]]=[ix[k+2],ix[k+1]];g.setIndex(ix);g.computeVertexNormals();return add(g,mat,group,name);}
band('Black rubber outsole',x=>.005+.009*Math.pow(Math.max(0,(-x-.09)/.058),2),x=>.012+.009*Math.pow(Math.max(0,(-x-.09)/.058),2),1.035,materials.black,'outsole');
band('Sculpted white midsole',x=>.011+.009*Math.pow(Math.max(0,(-x-.09)/.058),2),x=>base(x)+.001,1.06,materials.white,'midsole');
band('Leather mudguard',x=>base(x),x=>base(x)+.013+.006*T.MathUtils.smoothstep(x,.065,.14),1.015,materials.leather,'upper');
ellipsoid(-.138,.031,0,.0095,.019,.028,materials.leather,'upper','Rounded reinforced toe bumper');
// White stitched edge follows both sides of the mudguard.
for(const side of [-1,1]){const line=[];for(let i=0;i<=80;i++){const x=T.MathUtils.lerp(-.139,.14,i/80);line.push([x,base(x)+.013+.006*T.MathUtils.smoothstep(x,.065,.14),side*(cross(x)[0]*1.019+.0005)]);}tube(line,.00055,materials.seam,'upper',`Mudguard stitched edge ${side}`,90);for(let i=2;i<79;i+=2){const p=line[i],q=line[i+1];tube([p,q],.00022,materials.white,'upper',`Stitch ${side}-${i}`,1);}}
// Raised TPU cage: independent curved ribs on each side, sweeping toward lace stays.
const ribs=[[-.132,-.123],[-.111,-.099],[-.087,-.075],[-.059,-.054],[-.025,-.034],[.009,-.012],[.043,.012],[.078,.034],[.11,.071],[.132,.109]];
for(const side of [-1,1]) for(let r=0;r<ribs.length;r++){const [xb,xt]=ribs[r];const pts=[];for(let j=0;j<=14;j++){const t=j/14;const x=T.MathUtils.lerp(xb,xt,t)+.008*Math.sin(t*Math.PI);const a=side===1?T.MathUtils.lerp(.2,1.05,t):Math.PI-T.MathUtils.lerp(.2,1.05,t);pts.push(surface(x,a,.0018));}tube(pts,r<6?.00115:.0017,materials.white,'structural_support',`White wave cage ${side}-${r}`,36);}
// Heel panel and padded open collar. The opening stays dark and visible from above.
ellipsoid(.118,.065,0,.027,.037,.028,materials.leather,'heel_support','Sculpted white heel counter');
const collarPts=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;collarPts.push([.088+.039*Math.cos(a),.111+.008*Math.cos(a),.025*Math.sin(a)]);}
tube(collarPts,.0045,materials.leather,'upper','White padded collar rim',96);
ellipsoid(.088,.099,0,.034,.008,.021,materials.black,'insole','Dark interior cavity');
ellipsoid(.089,.101,0,.031,.003,.019,materials.lining,'insole','Visible padded footbed');
// Tongue and lace stays follow the sloping instep.
const tongue=ellipsoid(.004,.098,0,.060,.006,.021,materials.leather,'upper','Padded white tongue');tongue.rotation.z=.36;
for(const side of [-1,1]){const pts=[];for(let i=0;i<=24;i++){const x=T.MathUtils.lerp(-.086,.041,i/24);pts.push([x,cross(x)[1]+.002,side*.018]);}tube(pts,.0031,materials.leather,'upper',`White lace stay ${side}`,32);}
for(let i=0;i<8;i++){const x=-.078+i*.015;const y=cross(x)[1]+.006;for(const side of [-1,1]){ellipsoid(x,y,side*.018,.003,.0018,.0035,materials.white,'laces',`Eyelet ${side}-${i}`);}tube([[x,y,.018],[x+.005,y+.006,.006],[x+.011,y+.006,-.006],[x+.014,cross(x+.014)[1]+.006,-.018]],.00165,materials.lace,'laces',`Diagonal woven lace ${i}`,18);}
tube([[.027,.121,0],[.019,.132,.013],[.036,.132,.024],[.044,.124,.007],[.027,.121,0],[.019,.131,-.012],[.036,.131,-.022],[.044,.124,-.007],[.027,.121,0]],.0015,materials.lace,'laces','Tied lace loops',72);
// Air windows are recessed-looking tinted lenses with white capsule borders.
for(const side of [-1,1])for(const [i,x,sx,sy] of [[0,-.085,.011,.004],[1,-.042,.012,.004],[2,.079,.020,.006],[3,.129,.013,.005]]){const z=side*(cross(x)[0]*1.07+.001);const p=ellipsoid(x,.022,z,sx+.002,sy+.001,.0027,materials.white,'midsole',`Air window bezel ${side}-${i}`);ellipsoid(x,.022,z+side*.0017,sx,sy,.0028,materials.air,'midsole',`Blue Air lens ${side}-${i}`);for(let j=-1;j<=1;j++)ellipsoid(x+j*sx*.45,.021,z+side*.001,.0018,sy*.7,.0019,materials.blue,'midsole',`Air support ${side}-${i}-${j}`);}
for(const side of [-1,1]){const z=side*.039;const pts=[[-.013,.014,z],[.001,.027,z],[.018,.036,z],[.036,.038,z],[.046,.032,z],[.03,.025,z],[.025,.015,z],[.042,.01,z]];tube(pts,.004,materials.blue,'structural_support',`Blue whale-tail arch ${side}`,48);}
// Swoosh geometry traced as a slim curved polygon, raised from each quarter.
for(const side of [-1,1]){const s=new T.Shape();s.moveTo(-.008,.071);s.bezierCurveTo(-.019,.060,-.005,.056,.006,.063);s.bezierCurveTo(.024,.072,.041,.084,.056,.095);s.bezierCurveTo(.035,.083,.015,.075,.001,.070);s.bezierCurveTo(-.006,.067,-.010,.067,-.008,.071);const g=new T.ExtrudeGeometry(s,{depth:.0012,bevelEnabled:true,bevelSize:.0005,bevelThickness:.0005,bevelSegments:2,steps:1,curveSegments:24});const m=add(g,materials.white,'upper',`Raised side swoosh ${side}`);m.position.z=side*.044;if(side<0)m.scale.z=-1;}
// Outsole tread, toe bumper ribs and small heel badge.
for(let i=0;i<19;i++){const x=-.129+i*.014;const w=cross(x)[0];for(const side of [-1,1]){const block=add(new T.BoxGeometry(.008,.003,w*.65),materials.black,'outsole',`Traction block ${i}-${side}`);block.position.set(x,.004,side*w*.50);block.rotation.y=side*.22;}}
ellipsoid(.144,.086,0,.002,.009,.008,materials.blue,'heel_support','Blue heel badge');
shoe.userData={description:'Custom procedural Nike TN reference approximation. Not a scan or an exact manufacturer model.',source:'User-provided blue/white side photo and rotation recording',units:'metres',assembledPose:'Identity transforms; named editable component groups'};
scene.updateMatrixWorld(true);
let triangles=0;shoe.traverse(n=>{if(n.isMesh)triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;});
const binary=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true});
await writeFile('assets/tn-blue-white-approximation.glb',Buffer.from(binary));
await writeFile('reference/tn-blue-white/model-manifest.json',JSON.stringify({file:'assets/tn-blue-white-approximation.glb',bytes:binary.byteLength,triangles,approximation:true,groups:Object.keys(groups),generator:'tools/models/build-tn-model.mjs'},null,2));
console.log(JSON.stringify({bytes:binary.byteLength,triangles,groups:Object.keys(groups)}));
