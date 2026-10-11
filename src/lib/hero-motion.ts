export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function ease(value: number) {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function heroMotion(stage: number) {
  const t = clamp(stage);
  return {
    travel: t,
    unfold: ease((t - 0.12) / 0.76),
    panels: ease((t - 0.46) / 0.44),
    core: 1 - ease((t - 0.08) / 0.65),
    tilt: (1 - ease(t)) * 0.32,
    bloom: 0.17 * (1 - ease((stage - 0.75) / 0.25)),
  };
}
export const QUALITY = {
  desktop: { segments: 160, particles: 110, dpr: 1.5, bloomScale: 0.5 },
  mobile: { segments: 72, particles: 36, dpr: 1.15, bloomScale: 0.3 },
} as const;
