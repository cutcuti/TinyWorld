import { test } from "node:test";
import assert from "node:assert/strict";
import { createAnimals, stepAnimal, walkable, startChase } from "./wildlife";
import { initialWorld, inWater } from "./simulation";
test("all seven species wander safely within the expanded garden", () => {
  const animals = createAnimals(),
    plants = initialWorld().plants;
  assert.equal(new Set(animals.map((a) => a.species)).size, 7);
  const start = animals.map((a) => [a.x, a.z]);
  for (let i = 0; i < 3600; i++)
    for (const a of animals) {
      stepAnimal(a, 1 / 30, plants, animals, false, false);
      assert.ok(Math.hypot(a.x, a.z) < 5.45);
      assert.equal(inWater(a.x, a.z), a.species === "duck");
    }
  assert.ok(
    animals.every(
      (a, i) => Math.hypot(a.x - start[i][0], a.z - start[i][1]) > 0.1,
    ),
  );
});
test("night and reduced motion stop wandering, and new plants cannot trap animals", () => {
  const animals = createAnimals(),
    a = animals[0],
    plants = initialWorld().plants;
  const start = [a.x, a.z];
  stepAnimal(a, 1, plants, animals, true, false);
  assert.deepEqual([a.x, a.z], start);
  stepAnimal(a, 1, plants, animals, false, true);
  assert.deepEqual([a.x, a.z], start);
  plants.push({ ...plants[0], id: "new-tree", x: a.x, z: a.z });
  stepAnimal(a, 0.1, plants, animals, false, false);
  assert.ok(walkable(a.x, a.z, plants, animals, a.id));
});

test("dogs trigger bounded zoomies, scare the flock and ducks but never horses", () => {
  const all = createAnimals(),
    plants = initialWorld().plants,
    dog = all.find((a) => a.species === "dog")!;
  startChase(dog);
  for (const a of all) stepAnimal(a, 0.05, plants, all, false, false);
  for (const a of all)
    assert.equal(a.scared, !["dog", "horse"].includes(a.species));
  assert.ok(dog.chaseLeft > 0);
  for (let i = 0; i < 220; i++)
    for (const a of all) {
      stepAnimal(a, 0.05, plants, all, false, false);
      assert.ok(Math.hypot(a.x, a.z) < 5.45);
      assert.equal(inWater(a.x, a.z), a.species === "duck");
    }
  assert.equal(dog.chaseLeft, 0);
  assert.ok(all.every((a) => !a.scared));
});
