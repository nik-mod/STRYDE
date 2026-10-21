import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(1400,1050);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;document.body.append(renderer.domElement);
const scene=new T.Scene();const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.65;scene.add(new T.HemisphereLight(0xffffff,0x506580,1.1));const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(-2,4,5);scene.add(key);
const camera=new T.PerspectiveCamera(33,4/3,.001,10);
const gltf=await new GLTFLoader().loadAsync('/downloaded-model.glb');const model=gltf.scene;model.rotation.y=Math.PI/2;model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model);const center=box.getCenter(new T.Vector3());const size=box.getSize(new T.Vector3());model.position.sub(center);const rig=new T.Group();rig.add(model);rig.scale.setScalar(.3/Math.max(size.x,size.y,size.z));scene.add(rig);
const shots=[['profile',[0,.045,.58]],['angle',[-.27,.20,.48]],['heel',[.34,.17,-.40]],['sole',[-.10,-.43,.20]],['top',[-.05,.53,.10]],['detail',[-.15,.09,.25]]];
for(const [name,position] of shots){camera.position.fromArray(position);camera.lookAt(0,0,0);renderer.render(scene,camera);const blob=await new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));const res=await fetch('/capture/'+name,{method:'POST',body:blob});if(!res.ok)throw new Error(await res.text());document.querySelector('h1').textContent='Rendered '+name;}
document.querySelector('h1').textContent='All six model views rendered';
