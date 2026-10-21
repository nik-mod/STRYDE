// Bake a small static convex hull for accurate camera fitting. The renderer
// uses these surface points instead of projecting empty bounding-box corners.
// No geometry, texture, compression or node transforms are rewritten.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const [input, output] = process.argv.slice(2);
assert(input && output, 'Usage: node tools/models/bake-framing-hull.mjs input.glb output.glb');
const bytes = await readFile(input), jsonLength = bytes.readUInt32LE(12);
const json = JSON.parse(bytes.subarray(20, 20 + jsonLength)), bin = bytes.subarray(28 + jsonLength);
await MeshoptDecoder.ready;
const views = new Map();
function view(index) {
  if (views.has(index)) return views.get(index);
  const def = json.bufferViews[index], ext = def.extensions?.EXT_meshopt_compression;
  let result;
  if (ext) {
    assert.equal(ext.buffer, 0);
    result = new Uint8Array(ext.count * ext.byteStride);
    MeshoptDecoder.decodeGltfBuffer(result, ext.count, ext.byteStride, bin.subarray(ext.byteOffset || 0, (ext.byteOffset || 0) + ext.byteLength), ext.mode, ext.filter);
  } else {
    assert.equal(def.buffer, 0);
    result = bin.subarray(def.byteOffset || 0, (def.byteOffset || 0) + def.byteLength);
  }
  views.set(index, result); return result;
}
const formats = {5120:['getInt8',1,127],5121:['getUint8',1,255],5122:['getInt16',2,32767],5123:['getUint16',2,65535],5125:['getUint32',4,4294967295],5126:['getFloat32',4,1]};
const points = [];
function visit(index, parent) {
  const node = json.nodes[index]; assert(node.skin === undefined, 'Static models only');
  const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3().fromArray(node.translation || [0,0,0]),new Quaternion().fromArray(node.rotation || [0,0,0,1]),new Vector3().fromArray(node.scale || [1,1,1]));
  const world = new Matrix4().multiplyMatrices(parent, local);
  for (const primitive of json.meshes?.[node.mesh]?.primitives || []) {
    const accessor = json.accessors[primitive.attributes.POSITION];
    assert(!accessor.sparse && accessor.type === 'VEC3');
    const data = view(accessor.bufferView), dv = new DataView(data.buffer,data.byteOffset,data.byteLength);
    const [method,size,divisor] = formats[accessor.componentType], stride = json.bufferViews[accessor.bufferView].byteStride || size * 3;
    for (let i = 0; i < accessor.count; i++) {
      const xyz = [0,1,2].map(axis => {const value=dv[method]((accessor.byteOffset || 0)+i*stride+axis*size,true);return accessor.normalized ? Math.max(-1,value/divisor) : value;});
      points.push(new Vector3(...xyz).applyMatrix4(world));
    }
  }
  for (const child of node.children || []) visit(child, world);
}
const scene = json.scenes[json.scene || 0];
for (const node of scene.nodes) visit(node,new Matrix4());
const hull = new ConvexHull().setFromPoints(points), vertices = new Set();
for (const face of hull.faces) {let edge=face.edge;do{vertices.add(edge.head().point);edge=edge.next;}while(edge!==face.edge);}
assert(vertices.size > 3 && vertices.size < 5000);
scene.extras = {...scene.extras, strydeFramingHull:[...vertices].map(p=>p.toArray().map(value=>+value.toFixed(5)))};
const encoded = Buffer.from(JSON.stringify(json)), padded = Math.ceil(encoded.length/4)*4;
const header=Buffer.from(bytes.subarray(0,20)); header.writeUInt32LE(padded,12);
const result=Buffer.concat([header,encoded,Buffer.alloc(padded-encoded.length,32),bytes.subarray(20+jsonLength)]);
result.writeUInt32LE(result.length,8); await writeFile(output,result);
console.log(JSON.stringify({vertices:points.length,hullPoints:vertices.size,bytes:result.length}));
