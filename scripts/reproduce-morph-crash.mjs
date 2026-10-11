import fs from 'node:fs';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { WebGLMorphtargets } from 'three/src/renderers/webgl/WebGLMorphtargets.js';
import { ribbonGeometry } from '../src/lib/hero-geometry.ts';

// CPU reproduction of the old R3F geometry attachment, using the installed
// Three.js morph uploader and real composer/RenderPass. This is not browser QA.
const mesh = new THREE.Mesh();
mesh.geometry = ribbonGeometry(0, 160); // Attaching a primitive doesn't initialize mesh weights.
const scene = new THREE.Scene(); scene.add(mesh);
const morphs = WebGLMorphtargets({}, { maxTextureSize: 4096 }, {});
let target = null;
const renderer = {
  autoClear: true,
  getPixelRatio: () => 1,
  getSize: vector => vector.set(1440, 900),
  getRenderTarget: () => target,
  setRenderTarget: value => { target = value; },
  clear() {},
  render(root) {
    root.traverse(object => {
      if (object.isMesh && object.geometry.morphAttributes.position) {
        morphs.update(object, object.geometry, { getUniforms: () => ({ setValue() {} }) });
      }
    });
  },
};
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, new THREE.PerspectiveCamera()));
try {
  composer.render(1 / 60);
  throw new Error('Expected the pre-fix path to reproduce the crash');
} catch (error) {
  if (!error.stack.includes('WebGLMorphtargets.js:140')) throw error;
  console.log(error.stack);
  fs.mkdirSync('performance', { recursive: true });
  fs.writeFileSync('performance/runtime-crash-stack.txt', `${error.stack}\n\nUndefined value: mesh.morphTargetInfluences (objectInfluences).\nCPU reproduction with the installed Three.js uploader; not a captured browser stack.\n`);
}
mesh.geometry.dispose(); composer.dispose();
