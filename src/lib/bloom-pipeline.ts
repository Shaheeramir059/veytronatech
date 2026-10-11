import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export type BloomSize = { width: number; height: number; dpr: number; scale: number };
export type BloomPipeline = {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera;
  composer: EffectComposer; bloom: UnrealBloomPass; renderPass: RenderPass;
  users: number; disposed: boolean; ready: boolean; failed: boolean;
  sizing: string; width: number; height: number; dpr: number;
  clearColor: THREE.Color; viewport: THREE.Vector4; scissor: THREE.Vector4;
};
// RenderPass retains its scene and camera. Renderer-only cache keys were unsafe.
const cache = new WeakMap<THREE.WebGLRenderer, WeakMap<THREE.Scene, WeakMap<THREE.Camera, BloomPipeline>>>();

function cameraCache(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  let scenes = cache.get(renderer);
  if (!scenes) { scenes = new WeakMap(); cache.set(renderer, scenes); }
  let cameras = scenes.get(scene);
  if (!cameras) { cameras = new WeakMap(); scenes.set(scene, cameras); }
  return cameras;
}

export function resizeBloomPipeline(resource: BloomPipeline, size: BloomSize) {
  if (resource.disposed || resource.failed) throw new Error("Cannot resize an invalid bloom pipeline");
  const { width, height, dpr, scale } = size;
  if (![width, height, dpr, scale].every(value => Number.isFinite(value) && value > 0)) throw new Error("Invalid bloom dimensions or DPR");
  const key = `${width}:${height}:${dpr}:${scale}`;
  if (resource.sizing === key) return;
  resource.ready = false;
  if (resource.dpr !== dpr) resource.composer.setPixelRatio(dpr);
  if (resource.width !== width || resource.height !== height) resource.composer.setSize(width, height);
  resource.bloom.setSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  resource.width = width; resource.height = height; resource.dpr = dpr; resource.sizing = key;
  resource.ready = true;
}

function disposePipeline(resource: BloomPipeline) {
  if (resource.disposed) return;
  resource.disposed = true; resource.ready = false;
  resource.composer.passes.forEach(pass => pass.dispose());
  // r178 UnrealBloomPass.dispose omits this owned shader material.
  resource.bloom.materialHighPassFilter.dispose();
  resource.composer.dispose();
}

export function invalidateBloomPipeline(resource: BloomPipeline) {
  resource.failed = true; resource.ready = false;
  const cameras = cameraCache(resource.renderer, resource.scene);
  if (cameras.get(resource.camera) === resource) cameras.delete(resource.camera);
}

function createPipeline(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, size: BloomSize): BloomPipeline {
  const composer = new EffectComposer(renderer);
  let bloom: UnrealBloomPass | undefined;
  try {
    bloom = new UnrealBloomPass(new THREE.Vector2(Math.max(1, size.width * size.scale), Math.max(1, size.height * size.scale)), 0.17, 0.28, 1.1);
    bloom.blendMaterial.fragmentShader = bloom.blendMaterial.fragmentShader.replace(
      "gl_FragColor = opacity * texel;",
      "gl_FragColor = opacity * texel; gl_FragColor.a = clamp(max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b), 0.0, 1.0);"
    );
    bloom.blendMaterial.blending = THREE.CustomBlending;
    bloom.blendMaterial.blendSrc = THREE.OneFactor; bloom.blendMaterial.blendDst = THREE.OneFactor;
    bloom.blendMaterial.blendSrcAlpha = THREE.OneFactor; bloom.blendMaterial.blendDstAlpha = THREE.OneFactor;
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass); composer.addPass(bloom); composer.addPass(new OutputPass());
    const dimensions = renderer.getSize(new THREE.Vector2());
    const resource: BloomPipeline = {
      renderer, scene, camera, composer, bloom, renderPass,
      users: 0, disposed: false, ready: false, failed: false,
      sizing: "", width: dimensions.width, height: dimensions.height, dpr: renderer.getPixelRatio(),
      clearColor: new THREE.Color(), viewport: new THREE.Vector4(), scissor: new THREE.Vector4(),
    };
    // Publish only after all passes, DPR, base targets and reduced bloom buffers are valid.
    resizeBloomPipeline(resource, size);
    return resource;
  } catch (error) {
    composer.passes.forEach(pass => pass.dispose());
    if (bloom) {
      if (!composer.passes.includes(bloom)) bloom.dispose();
      bloom.materialHighPassFilter.dispose();
    }
    composer.dispose();
    throw error;
  }
}

export function acquireBloomPipeline(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, size: BloomSize) {
  const cameras = cameraCache(renderer, scene);
  let resource = cameras.get(camera);
  if (!resource || resource.disposed || resource.failed) {
    resource = createPipeline(renderer, scene, camera, size);
    cameras.set(camera, resource);
  } else resizeBloomPipeline(resource, size);
  const owned = resource;
  owned.users++;
  let released = false;
  return { pipeline: owned, release() {
    if (released) return;
    released = true; owned.users--;
    queueMicrotask(() => {
      if (owned.users !== 0) return;
      if (cameras.get(camera) === owned) cameras.delete(camera);
      disposePipeline(owned);
    });
  } };
}

export function renderBloomPipeline(resource: BloomPipeline, strength: number, delta: number, report: (error: unknown) => void) {
  if (!resource.ready || resource.disposed || resource.failed || resource.users === 0) return false;
  const gl = resource.renderer;
  const target = gl.getRenderTarget(), autoClear = gl.autoClear, alpha = gl.getClearAlpha(), scissorTest = gl.getScissorTest();
  gl.getClearColor(resource.clearColor); gl.getViewport(resource.viewport); gl.getScissor(resource.scissor);
  try {
    resource.bloom.strength = strength;
    resource.composer.render(delta);
    return true;
  } catch (error) {
    // Stop reusing the broken pipeline. A resize/context restore/remount can
    // acquire a fresh one; never retry the same broken object every frame.
    invalidateBloomPipeline(resource);
    report(error);
    return false;
  } finally {
    // An exception in RenderPass/Bloom otherwise strands the renderer in a
    // composer FBO with autoClear=false. Restore before a direct-render fallback.
    gl.autoClear = autoClear;
    gl.setClearColor(resource.clearColor, alpha);
    gl.setRenderTarget(target);
    gl.setViewport(resource.viewport); gl.setScissor(resource.scissor); gl.setScissorTest(scissorTest);
  }
}
