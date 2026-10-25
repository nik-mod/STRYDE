// Offline delivery mesh. Keep source textures/materials and node transforms;
// reduce dense scan geometry with UV- and normal-aware meshoptimizer errors.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { MeshoptSimplifier } from 'three/addons/libs/meshopt_simplifier.module.js';

const [input, output, triangles = '180000'] = process.argv.slice(2);
assert(input && output, 'Usage: prepare-web-model.mjs input.glb output.glb [triangle budget]');
const source = await readFile(input), jsonLength = source.readUInt32LE(12);
const json = JSON.parse(source.subarray(20, 20 + jsonLength));
const bin = source.subarray(28 + jsonLength);
assert.equal(json.meshes.length, 1); assert.equal(json.meshes[0].primitives.length, 1);
assert(!json.animations && !json.skins, 'Static product models only');
await Promise.all([MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const views = new Map();
function view(index) {
  if (views.has(index)) return views.get(index);
  const def = json.bufferViews[index], ext = def.extensions?.EXT_meshopt_compression;
  let bytes;
  if (ext) {
    bytes = new Uint8Array(ext.count * ext.byteStride);
    MeshoptDecoder.decodeGltfBuffer(bytes, ext.count, ext.byteStride, bin.subarray(ext.byteOffset || 0, (ext.byteOffset || 0) + ext.byteLength), ext.mode, ext.filter);
  } else { assert.equal(def.buffer, 0); bytes = bin.subarray(def.byteOffset || 0, (def.byteOffset || 0) + def.byteLength); }
  views.set(index, bytes); return bytes;
}
const formats = {5120:['getInt8',1,127],5121:['getUint8',1,255],5122:['getInt16',2,32767],5123:['getUint16',2,65535],5125:['getUint32',4,4294967295],5126:['getFloat32',4,1]};
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function accessor(index) {
  const def = json.accessors[index], bytes = view(def.bufferView);
  const [method, size, divisor] = formats[def.componentType], count = components[def.type];
  const stride = json.bufferViews[def.bufferView].byteStride || size * count;
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = new Float32Array(def.count * count);
  for (let vertex = 0; vertex < def.count; vertex++) for (let axis = 0; axis < count; axis++) {
    const value = data[method]((def.byteOffset || 0) + vertex * stride + axis * size, true);
    values[vertex * count + axis] = def.normalized ? Math.max(-1, value / divisor) : value;
  }
  return { def, bytes, stride, count, values };
}
const primitive = json.meshes[0].primitives[0];
const attributes = Object.fromEntries(Object.entries(primitive.attributes).map(([name, index]) => [name, accessor(index)]));
const indicesDef = json.accessors[primitive.indices], indicesBytes = view(indicesDef.bufferView);
const indices = new Uint32Array(indicesDef.count), indexData = new DataView(indicesBytes.buffer, indicesBytes.byteOffset, indicesBytes.byteLength);
const [indexMethod, indexSize] = formats[indicesDef.componentType];
for (let i = 0; i < indices.length; i++) indices[i] = indexData[indexMethod]((indicesDef.byteOffset || 0) + i * indexSize, true);
const positions = attributes.POSITION.values, count = attributes.POSITION.def.count;
const surface = new Float32Array(count * 5);
for (let i = 0; i < count; i++) {
  surface.set(attributes.NORMAL.values.subarray(i * 3, i * 3 + 3), i * 5);
  surface.set(attributes.TEXCOORD_0.values.subarray(i * 2, i * 2 + 2), i * 5 + 3);
}
const [simplified, error] = MeshoptSimplifier.simplifyWithAttributes(indices, positions, 3, surface, 5,
  [.015, .015, .015, .15, .15], null, Math.min(indices.length, Number(triangles) * 3), .003, ['RegularizeLight']);
const remap = new Int32Array(count).fill(-1), used = [], compact = new Uint32Array(simplified.length);
for (let i = 0; i < simplified.length; i++) {
  const old = simplified[i];
  if (remap[old] === -1) { remap[old] = used.length; used.push(old); }
  compact[i] = remap[old];
}
const chunks = [], outputViews = [], outputAccessors = []; let offset = 0;
function append(bytes, extra = {}) {
  const padding = (4 - offset % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  const id = outputViews.length;
  outputViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.byteLength, ...extra });
  chunks.push(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)); offset += bytes.byteLength;
  return id;
}
for (const image of json.images) { const bytes = view(image.bufferView); image.bufferView = append(bytes); }
for (const [name, attribute] of Object.entries(attributes)) {
  const bytes = Buffer.alloc(used.length * attribute.stride);
  used.forEach((old, index) => bytes.set(attribute.bytes.subarray(old * attribute.stride, (old + 1) * attribute.stride), index * attribute.stride));
  const bufferView = append(bytes, { byteStride: attribute.stride, target: 34962 });
  primitive.attributes[name] = outputAccessors.length;
  outputAccessors.push({ ...attribute.def, bufferView, byteOffset: 0, count: used.length });
}
primitive.indices = outputAccessors.length;
outputAccessors.push({ type: 'SCALAR', componentType: 5125, count: compact.length, bufferView: append(new Uint8Array(compact.buffer), { target: 34963 }) });
json.bufferViews = outputViews; json.accessors = outputAccessors;
const binary = Buffer.concat(chunks), paddedBinary = Buffer.concat([binary, Buffer.alloc((4 - binary.length % 4) % 4)]);
json.buffers = [{ byteLength: paddedBinary.length }];
for (const key of ['extensionsUsed','extensionsRequired']) json[key] = json[key].filter(name => name !== 'EXT_meshopt_compression');
json.asset.extras = { ...json.asset.extras, deliveryMesh: { sourceTriangles: indices.length / 3, triangles: compact.length / 3, error, textures: 'original, unchanged' } };
const encoded = Buffer.from(JSON.stringify(json)), paddedJSON = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]);
const header = Buffer.alloc(20); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + paddedJSON.length + paddedBinary.length, 8); header.writeUInt32LE(paddedJSON.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
const binaryHeader = Buffer.alloc(8); binaryHeader.writeUInt32LE(paddedBinary.length, 0); binaryHeader.writeUInt32LE(0x004e4942, 4);
await writeFile(output, Buffer.concat([header, paddedJSON, binaryHeader, paddedBinary]));
console.log(JSON.stringify({ sourceTriangles: indices.length / 3, triangles: compact.length / 3, vertices: used.length, error, bytes: header.readUInt32LE(8) }));
