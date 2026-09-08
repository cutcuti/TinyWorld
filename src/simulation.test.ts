import { collectAnimal, nextSeason, harvest, inviteAnimal } from "./simulation";
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

test("harvest cooldowns prevent repeat collections, and seasons only advance in order", () => {
  let w = initialWorld();
  const milk = collectAnimal(w, 3, "cow");
  assert.equal(milk.world.basket.milk, 1);
  assert.equal(collectAnimal(milk.world, 3, "cow").world.basket.milk, 1);
  w = collectAnimal(milk.world, 2, "chicken").world;
  assert.equal(w.basket.eggs, 1);
  for (let i = 0; i < 20; i++) w = advance(w, 1);
  assert.equal(collectAnimal(w, 3, "cow").world.basket.milk, 2);
  for (const season of [1, 2, 3, 0]) {
    w = nextSeason(w);
    assert.equal(w.season, season);
  }
});
test("fruit is harvestable, regrows with time, and rests in winter", () => {
  const original = initialWorld(),
    id = original.plants[0].id;
  let w = harvest(original, id).world;
  assert.equal(w.basket.fruit, 2);
  assert.equal(harvest(w, id).world.basket.fruit, 2);
  for (let i = 0; i < 20; i++) w = advance(w, 1);
  assert.ok(w.plants[0].fruit! >= 1);
  assert.equal(harvest(w, id).world.basket.fruit, 3);
  const winter = { ...w, season: 3 as const };
  assert.equal(advance(winter, 1).plants[0].fruit, winter.plants[0].fruit);
});
test("legacy gardens migrate without losing plants; basket and season persist", () => {
  const original = initialWorld();
  const raw = {
    ...original,
    season: 2,
    basket: { milk: 4, eggs: 3, fruit: 2 },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: { getItem: () => JSON.stringify(raw) },
    configurable: true,
  });
  assert.equal(loadWorld().basket.milk, 4);
  assert.equal(loadWorld().season, 2);
  const legacy = {
    version: 1,
    time: 12,
    paused: true,
    reduced: false,
    plants: original.plants.map(({ fruit, ...p }) => p),
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: { getItem: () => JSON.stringify(legacy) },
    configurable: true,
  });
  assert.equal(loadWorld().plants.length, 8);
  assert.equal(loadWorld().plants[0].fruit, 1);
  assert.equal(loadWorld().season, 0);
});

test("free world starts empty, accepts land and pond residents and aquatic plants", () => {
  const w = initialWorld("free");
  assert.equal(w.plants.length, 0);
  assert.deepEqual(w.animalSeeds, []);
  const duck = inviteAnimal(w, "duck", 1.55, 0.65);
  assert.equal(duck.world.animalSeeds?.length, 1);
  assert.equal(inviteAnimal(w, "cow", 1.55, 0.65).world, w);
  assert.equal(inviteAnimal(w, "cow", -2, 2).world.animalSeeds?.length, 1);
  assert.equal(canPlant([], 1.55, 0.65, "lotus"), true);
  assert.equal(canPlant([], 4, 0, "lotus"), false);
});
