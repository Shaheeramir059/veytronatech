import type { MeshStandardMaterial } from "three";
export function chromeRim(shader: Parameters<MeshStandardMaterial["onBeforeCompile"]>[0]) {
  shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `
    #include <emissivemap_fragment>
    float rim = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 4.0);
    totalEmissiveRadiance += vec3(0.025, 0.28, 0.42) * rim;
  `);
}
