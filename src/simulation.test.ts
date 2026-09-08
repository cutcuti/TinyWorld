import { loadWorld } from "./persistence";
import { test } from "node:test";
import assert from "node:assert/strict";
import { advance, canPlant, initialWorld, waterAt, LIMIT } from "./simulation";
test("rejects water, edges, occupied ground, invalid points and capacity overflow", () => {
  const w = initialWorld();
  assert.equal(canPlant(w.plants, 1.55, 0.65), false);
  assert.equal(canPlant([], 5.7, 0), false);
  assert.equal(canPlant(w.plants, -2.5, -1.6), false);
  assert.equal(canPlant([], NaN, 0), false);
  assert.equal(canPlant(w.plants, -2.5, 2.7), true);
  assert.equal(
    canPlant(
      Array.from({ length: LIMIT }, () => w.plants[0]),
      0,
      3,
    ),
    false,
  );
});
test("rain waters only nearby plants and accelerates bounded growth", () => {
  const w = initialWorld();
  w.plants = w.plants.map((p) => ({ ...p, growth: 0.2 }));
  const wet = waterAt(w, -2.5, -1.6);
  assert.equal(wet.plants[0].water, 8);
  assert.equal(wet.plants[4].water, 0);
  assert.ok(advance(wet, 1).plants[0].growth > advance(w, 1).plants[0].growth);
  let grown = wet;
  for (let i = 0; i < 100; i++) grown = advance(grown, 1);
  assert.equal(grown.plants[0].growth, 1);
  assert.equal(grown.plants[0].water, 0);
});
test("growth is frame-rate independent and paused time stays fixed", () => {
  const w = initialWorld();
  w.plants[0].growth = 0;
  const one = advance(w, 1);
  let many = w;
  for (let i = 0; i < 10; i++) many = advance(many, 0.1);
  assert.ok(Math.abs(one.plants[0].growth - many.plants[0].growth) < 1e-10);
  assert.equal(advance({ ...w, paused: true }, 1).time, w.time);
  assert.ok(advance({ ...w, time: 23.99 }, 1).time < 1);
});
test("restores a valid save and recovers from malformed or out-of-bounds saves", () => {
  const w = initialWorld();
  let raw = JSON.stringify(w);
  Object.defineProperty(globalThis, "localStorage", {
    value: { getItem: () => raw },
    configurable: true,
  });
  assert.deepEqual(loadWorld(), w);
  raw = "{broken";
  assert.equal(loadWorld().plants.length, 8);
  raw = JSON.stringify({ ...w, plants: [{ ...w.plants[0], x: 999 }] });
  assert.equal(loadWorld().plants.length, 8);
  raw = JSON.stringify({ ...w, plants: [{ ...w.plants[0], water: -20 }] });
  assert.equal(loadWorld().plants.length, 8);
});

test("expanded island accepts new ground and keeps old saves valid", () => {
  assert.equal(canPlant([], 5.2, 0), true);
  assert.equal(canPlant([], 5.8, 0), false);
});
