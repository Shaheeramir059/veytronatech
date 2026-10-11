type Sample = { ms: number; calls: number; triangles: number; geometries: number; textures: number };
const frames: Sample[] = [];
const failures: { phase: string; message: string; stack?: string; at: number }[] = [];
export function reportFailure(phase: string, error: unknown) {
  const failure = { phase, message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, at: performance.now() };
  failures.push(failure);
  if (failures.length > 20) failures.shift();
  console.error(`[VeytronaTech] ${phase}; diagnostics recorded in window.veytronaProfile().`, error);
}
let enabled: boolean | undefined;
export function mark(name: string) {
  if (typeof performance !== "undefined") performance.mark(`veytrona:${name}`);
}
export function measure(name: string, start: string, end: string) {
  try { performance.measure(`veytrona:${name}`, `veytrona:${start}`, `veytrona:${end}`); } catch { /* Partial traces remain useful. */ }
}
export function profileEnabled() {
  if (typeof window === "undefined") return false;
  return enabled ??= new URLSearchParams(window.location.search).has("profile");
}
export function recordFrame(sample: Sample) {
  if (!profileEnabled()) return;
  frames.push(sample);
  if (frames.length > 600) frames.shift();
}
export function profileReport() {
  const sorted = frames.map(frame => frame.ms).sort((a,b) => a-b);
  return {
    timings: performance.getEntriesByType("measure").filter(entry => entry.name.startsWith("veytrona:")),
    marks: performance.getEntriesByType("mark").filter(entry => entry.name.startsWith("veytrona:")),
    paint: performance.getEntriesByType("paint"),
    navigation: performance.getEntriesByType("navigation"),
    frames: [...frames],
    failures: [...failures],
    p95FrameIntervalMs: sorted[Math.floor(sorted.length * .95)] ?? null,
    medianFrameIntervalMs: sorted[Math.floor(sorted.length * .5)] ?? null,
    note: "CPU submission and requestAnimationFrame intervals; not GPU timer queries or confirmed pixel presentation.",
  };
}
declare global { interface Window { veytronaProfile?: typeof profileReport } }
if (typeof window !== "undefined") window.veytronaProfile = profileReport;
