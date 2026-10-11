import assert from 'node:assert/strict';
import test from 'node:test';
import { createRenderLoop, damp, type FrameDriver } from '../src/lib/animation';

function clock() {
  let id = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const driver: FrameDriver = {
    request(callback) { frames.set(++id, callback); return id; },
    cancel(key) { frames.delete(key); },
  };
  return {
    driver,
    get pending() { return frames.size; },
    frame(time: number) {
      const batch = [...frames.values()];
      frames.clear();
      batch.forEach((callback) => callback(time));
    },
  };
}

test('damping follows the same trajectory at 30, 60 and 120 Hz', () => {
  const result = [30, 60, 120].map((hz) => {
    let value = 0;
    for (let i = 0; i < hz; i++) value = damp(value, 1, 5, 1 / hz);
    return value;
  });
  result.forEach((value) => assert.ok(Math.abs(value - result[0]) < 1e-12));
  assert.equal(damp(0, 1, 5, -1), 0);
});

test('static scenes coalesce invalidations and then sleep', () => {
  const time = clock();
  let draws = 0;
  const loop = createRenderLoop(() => draws++, time.driver);
  loop.invalidate(); loop.invalidate(); loop.invalidate();
  assert.equal(time.pending, 1);
  time.frame(0);
  assert.equal(draws, 1);
  assert.equal(time.pending, 0);
  time.frame(16);
  assert.equal(draws, 1);
});

test('continuous scenes cancel GPU work when hidden and resume without a time jump', () => {
  const time = clock();
  const deltas: number[] = [];
  const loop = createRenderLoop((dt) => deltas.push(dt), time.driver);
  loop.setContinuous(true);
  time.frame(0); time.frame(16);
  assert.equal(time.pending, 1);
  loop.setVisible(false);
  loop.invalidate();
  assert.equal(time.pending, 0);
  time.frame(10000);
  assert.equal(deltas.length, 2);
  loop.setVisible(true);
  time.frame(11000);
  assert.equal(deltas[2], 1 / 60);
  assert.equal(time.pending, 1);
  loop.dispose();
});

test('pausing settles in one static frame and never starts an idle polling loop', () => {
  const time = clock();
  let draws = 0;
  const loop = createRenderLoop(() => draws++, time.driver);
  loop.setContinuous(true); time.frame(0);
  loop.setContinuous(false); time.frame(16);
  assert.equal(draws, 2);
  assert.equal(time.pending, 0);
  loop.setContinuous(false);
  assert.equal(time.pending, 0);
});

test('long stalls cap animation delta', () => {
  const time = clock();
  const deltas: number[] = [];
  const loop = createRenderLoop((dt) => deltas.push(dt), time.driver);
  loop.setContinuous(true); time.frame(0); time.frame(2000);
  assert.equal(deltas[1], 0.05);
  loop.dispose();
});

test('disposal cancels outstanding work and ignores later events', () => {
  const time = clock();
  let draws = 0;
  const loop = createRenderLoop(() => draws++, time.driver);
  loop.setContinuous(true);
  loop.dispose();
  loop.invalidate(); loop.setVisible(true); loop.setContinuous(false);
  time.frame(10);
  assert.equal(time.pending, 0);
  assert.equal(draws, 0);
});
