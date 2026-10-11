// All choreography is a pure function of the existing GSAP journey stage.
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
export function transitionAmount(stage: number, from: number) { return smooth((stage - from - 0.08) / 0.84); }
export function bridgeHandoff(stage: number) { return smooth((stage - 1.02) / 0.06); }
export function detailWeight(stage: number, anchor: number) {
  return smooth((stage - anchor + 0.72) / 0.5) * (1 - smooth((stage - anchor - 0.22) / 0.5));
}
/** Base is website topology; four targets are network, voice, portal and emblem. */
export function writeTransitionWeights(stage: number, weights: { [index: number]: number; length: number }) {
  for (let i = 0; i < weights.length; i++) weights[i] = 0;
  const position = Math.max(1, Math.min(5, stage));
  const from = Math.min(4, Math.floor(position)) - 1;
  const amount = transitionAmount(position, from + 1);
  if (from > 0) weights[from - 1] = 1 - amount;
  weights[from] = amount;
}
export function portalFlight(stage: number) {
  const t = transitionAmount(stage, 3);
  // The old nine-unit crest put the front trim almost on the near plane.
  // Retain aperture travel with enough clearance for the entire tilted strip.
  return Math.sin(Math.PI * t) ** 2 * 6.4;
}
const pulse = (stage: number, from: number) => Math.sin(Math.PI * transitionAmount(stage, from)) ** 2;
export function cameraDolly(stage: number) {
  return .32 * pulse(stage, 1) + .48 * pulse(stage, 2)
    + 2.4 * transitionAmount(stage, 3) * (1 - transitionAmount(stage, 4));
}
export function cameraLateral(stage: number) {
  return .1 * pulse(stage, 1) - .12 * pulse(stage, 2) + .16 * pulse(stage, 4)
    + 2.03 * transitionAmount(stage, 3) * (1 - transitionAmount(stage, 4));
}
export function cameraElevation(stage: number) {
  if (stage <= 1) return .12 + Math.sin(stage * Math.PI) * .11;
  const heroExit = .11 * Math.sin(stage * Math.PI) * (1 - smooth((stage - 1) / .5));
  return .12 + heroExit + .06 * pulse(stage, 1) + .12 * pulse(stage, 2) - .07 * pulse(stage, 3) + .04 * pulse(stage, 4);
}
export function cameraFilmOffset(stage: number, filmWidth: number) {
  const dolly = cameraDolly(stage), lateral = cameraLateral(stage);
  if (dolly === 0 && lateral === 0) return 0;
  // Off-axis projection holds the artwork in its desktop column while the
  // camera itself moves into the portal's aperture. Mobile stays centered.
  return -(2.03 / 8.7 - (2.03 - lateral) / (8.7 - dolly)) * filmWidth;
}
export function spiralAngle(stage: number) { return pulse(stage, 2) * .62; }
/** Interpolate precomputed instance poses without arrays/vectors allocated per frame. */
export function writeInstancePose(stage: number, index: number, layouts: readonly Float32Array[], out: Float64Array) {
  const position = Math.max(1, Math.min(5, stage));
  const from = Math.min(3, Math.floor(position) - 1), t = transitionAmount(position, from + 1);
  const a = layouts[from], b = layouts[from + 1], offset = index * 9;
  for (let component = 0; component < 9; component++) {
    const start = a[offset + component], end = b[offset + component];
    const difference = component >= 3 && component < 6 ? Math.atan2(Math.sin(end - start), Math.cos(end - start)) : end - start;
    out[component] = start + difference * t;
  }
  // Fragments peel out into depth, then settle onto their next endpoint.
  out[2] += Math.sin(Math.PI * t) ** 2 * Math.sin(index * 1.73) * (from === 0 ? 0.8 : 0.32);
  const twist = spiralAngle(stage), x = out[0], y = out[1];
  out[0] = x * Math.cos(twist) - y * Math.sin(twist);
  out[1] = x * Math.sin(twist) + y * Math.cos(twist);
  out[5] += twist;
}
