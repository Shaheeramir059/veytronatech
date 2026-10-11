export function scenePreloadDeadline(stage: number) {
  // At least one full scene ahead of the next appearance (which starts at i - .88).
  return Math.min(5, Math.max(2, Math.ceil(Math.max(0, stage)) + 1));
}

/** Bounded idle work: timeout prevents perpetual starvation during interaction. */
export function scheduleIdle(task: () => void, timeout = 250) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(task, 16);
  return () => window.clearTimeout(id);
}
