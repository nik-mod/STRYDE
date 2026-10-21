import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0xdde5eb);scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;
const camera=new T.PerspectiveCamera(35,innerWidth/innerHeight,.001,10);camera.position.set(-.34,.22,.49);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.065,0);controls.enableDamping=true;controls.minDistance=.2;controls.maxDistance=1;
scene.environmentIntensity=.45;scene.add(new T.HemisphereLight(0xffffff,0x34445a,.8));const light=new T.DirectionalLight(0xffffff,2);light.position.set(-.2,.5,.4);scene.add(light);
const imported=new URLSearchParams(location.search).get('model')==='downloaded';
const model=await new GLTFLoader().loadAsync(imported?'/downloaded-model.glb':'/assets/tn-blue-white-approximation.glb');scene.add(model.scene);document.querySelector('#status').textContent='72k triangles · 2.3 MB GLB · drag to rotate';
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
document.querySelector('#side').onclick=()=>{camera.position.set(0,.105,.55);controls.target.set(0,.065,0);};
document.querySelector('#angle').onclick=()=>{camera.position.set(-.34,.22,.49);controls.target.set(0,.065,0);};
document.querySelector('#parts').onclick=()=>{const expanded=document.querySelector('#parts').dataset.expanded!=='yes';document.querySelector('#parts').dataset.expanded=expanded?'yes':'no';const offsets={outsole:-.045,midsole:-.020,upper:.02,laces:.07,insole:.10,heel_support:.015,structural_support:.035};model.scene.traverse(n=>{if(offsets[n.name]!==undefined)n.position.y=expanded?offsets[n.name]:0;});};

if(imported){const box=new T.Box3().setFromObject(model.scene);const size=box.getSize(new T.Vector3());const center=box.getCenter(new T.Vector3());const scale=.3/Math.max(size.x,size.y,size.z);model.scene.position.sub(center);const wrapper=new T.Group();scene.remove(model.scene);wrapper.add(model.scene);wrapper.scale.setScalar(scale);wrapper.position.y=.065;scene.add(wrapper);document.querySelector('header p').textContent='Your downloaded model · interactive 3D view';document.querySelector('aside').textContent='Local viewer · drag to rotate · scroll to zoom';document.querySelector('#status').textContent='963,230 triangles · original textures preserved';document.querySelector('#parts').hidden=true;document.querySelector('footer a').href='/downloaded-model.glb';}
