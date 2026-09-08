import { test } from "node:test";
import assert from "node:assert/strict";
import { createAnimals } from "./wildlife";
import { stepRest, bedPosition } from "./rest";
test("bedtime stretches, sends every species to a cloud, and chickens wake first", () => {
  const all = createAnimals();
  for (const a of all) stepRest(a, 0.1, 22, false);
  assert.ok(all.every((a) => a.rest.stage === "stretch"));
  for (let i = 0; i < 80; i++) for (const a of all) stepRest(a, 0.1, 22, false);
  for (const a of all) {
    assert.equal(a.rest.stage, "sleep");
    const bed = bedPosition(a);
    assert.ok(Math.abs(a.x - bed.x) < 1e-10);
    assert.ok(Math.abs(a.z - bed.z) < 1e-10);
    assert.ok(a.rest.y > 3);
  }
  for (let i = 0; i < 40; i++)
    for (const a of all) stepRest(a, 0.1, 5.8, false);
  assert.ok(
    all
      .filter((a) => a.species === "chicken")
      .every((a) => a.rest.stage === "awake"),
  );
  assert.ok(
    all
      .filter((a) => a.species !== "chicken")
      .every((a) => a.rest.stage === "sleep"),
  );
  for (let i = 0; i < 40; i++) for (const a of all) stepRest(a, 0.1, 7, false);
  assert.ok(all.every((a) => a.rest.stage === "awake"));
});
test("reduced motion puts every animal directly on its cloud", () => {
  for (const a of createAnimals()) {
    stepRest(a, 0.1, 22, true);
    assert.equal(a.rest.stage, "sleep");
    assert.ok(a.rest.y > 3);
    stepRest(a, 0.1, 9, true);
    assert.equal(a.rest.stage, "awake");
  }
});
