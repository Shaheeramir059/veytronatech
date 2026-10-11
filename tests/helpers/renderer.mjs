import * as THREE from 'three';
import { WebGLMorphtargets } from 'three/src/renderers/webgl/WebGLMorphtargets.js';

// Real Three.js objects/passes and morph upload logic, with CPU renderer state.
// This validates initialization and ownership without claiming GPU/browser QA.
export function rendererHarness(width = 1440, height = 900, dpr = 1.5) {
  const morphs = WebGLMorphtargets({}, { maxTextureSize: 4096 }, {});
  const color = new THREE.Color('#123456');
  let alpha = .3, target = null, ratio = dpr, scissorTest = true;
  const viewport = new THREE.Vector4(2, 3, width, height), scissor = viewport.clone();
  const canvas = { width, height, style: {}, addEventListener() {}, removeEventListener() {} };
  const renderer = {
    domElement: canvas, autoClear: true, autoClearColor: true, autoClearDepth: true, autoClearStencil: true,
    outputColorSpace: THREE.SRGBColorSpace, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1,
    shadowMap: { enabled: false, type: THREE.PCFShadowMap },
    xr: { enabled: false, isPresenting: false, addEventListener() {}, removeEventListener() {} },
    calls: 0, failAt: null, weights: [],
    getPixelRatio: () => ratio,
    setPixelRatio(value) { ratio = value; },
    getSize: vector => vector.set(width, height),
    setSize(w, h) { width = w; height = h; },
    getRenderTarget: () => target,
    setRenderTarget(value) { target = value; viewport.set(0, 0, value?.width ?? width, value?.height ?? height); },
    getClearColor: value => value.copy(color),
    setClearColor(value, nextAlpha) { color.set(value); if (nextAlpha !== undefined) alpha = nextAlpha; },
    getClearAlpha: () => alpha,
    setClearAlpha(value) { alpha = value; },
    getViewport: value => value.copy(viewport),
    setViewport(value) { viewport.copy(value); },
    getScissor: value => value.copy(scissor),
    setScissor(value) { scissor.copy(value); },
    getScissorTest: () => scissorTest,
    setScissorTest(value) { scissorTest = value; },
    clear() {}, clearDepth() {}, setAnimationLoop() {},
    render(root) {
      this.calls++;
      if (this.failAt === this.calls) throw new Error('Injected pass render failure');
      root.traverseVisible(object => {
        if (object.isMesh && object.geometry.morphAttributes.position) {
          morphs.update(object, object.geometry, { getUniforms: () => ({ setValue() {} }) });
          this.weights.push([...object.morphTargetInfluences]);
        }
      });
    },
  };
  return renderer;
}
