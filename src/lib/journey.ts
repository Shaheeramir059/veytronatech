/** Map actual section positions to camera stages, including a clamped final stop. */
export function getJourneyStage(scrollY: number, stops: readonly number[]): number {
  let stage = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (scrollY >= stops[i]) {
      stage = i + Math.min(1, Math.max(0, (scrollY - stops[i]) / Math.max(1, stops[i + 1] - stops[i])));
    }
  }
  return stage;
}
