const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };

export function titleFitScale(available: number, measured: number) {
  return measured > 0 ? Math.min(1, Math.max(0, available - 2) / measured) : 1;
}

/** Keep the complete copy in a reading slot, then hand it off inside that slot.
 * Measurements are cached at refresh; scrolling performs no layout reads.
 * Oversized/zoomed copy retains normal document flow so every link is reachable.
 */
export function copyPose(stage: number, index: number, scroll: number, naturalTop: number, height: number, viewport: number, mobile: boolean, reduced: boolean) {
  const safeTop = mobile ? 100 : 112, safeBottom = mobile ? 76 : 86;
  const space = viewport - safeTop - safeBottom;
  if (reduced || height > space || space <= 0) return { shift: 0, opacity: 1, interactive: true };
  const distance = stage - index;
  const opacity = 1 - smooth((Math.abs(distance) - .24) / .26);
  const center = mobile ? 110 : (viewport - height) / 2;
  const target = Math.max(safeTop, Math.min(viewport - safeBottom - height, center - distance * 32));
  return { shift: scroll + target - naturalTop, opacity, interactive: opacity > .05 };
}
