/** Exponential damping has the same response at 30, 60 and 120 Hz. */
export function damp(current: number, target: number, speed: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-speed * Math.max(0, dt)));
}

export type FrameDriver = {
  request: (callback: FrameRequestCallback) => number;
  cancel: (id: number) => void;
};

/** A sleeping render loop. Static scenes render only when invalidated. */
export function createRenderLoop(
  draw: (delta: number, time: number) => void,
  driver: FrameDriver = {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  },
) {
  let pending: number | null = null;
  let previous: number | null = null;
  let visible = true;
  let continuous = false;
  let disposed = false;

  function invalidate() {
    if (!disposed && visible && pending === null) pending = driver.request(tick);
  }

  function tick(time: number) {
    pending = null;
    if (disposed || !visible) return;
    const delta = previous === null ? 1 / 60 : Math.min((time - previous) / 1000, 0.05);
    previous = time;
    draw(delta, time);
    if (continuous) invalidate();
  }

  return {
    invalidate,
    setContinuous(value: boolean) {
      if (continuous === value) return;
      continuous = value;
      previous = null;
      invalidate();
    },
    setVisible(value: boolean) {
      visible = value;
      previous = null;
      if (value) invalidate();
      else if (pending !== null) {
        driver.cancel(pending);
        pending = null;
      }
    },
    dispose() {
      disposed = true;
      if (pending !== null) driver.cancel(pending);
      pending = null;
    },
  };
}
