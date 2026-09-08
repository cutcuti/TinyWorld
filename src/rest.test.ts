import { test } from "node:test";
import assert from "node:assert/strict";
import { createAnimals } from "./wildlife";
import { stepRest, cloudSleeper, visitFromShed, bedPosition } from "./rest";
test("bedtime stretches, hops to tiny shed or cloud, and chickens wake first", () => {
  const all = createAnimals();
  for (const a of all) stepRest(a, 0.1, 22, false);
  assert.ok(all.every((a) => a.rest.stage === "stretch"));
  for (let i = 0; i < 80; i++) for (const a of all) stepRest(a, 0.1, 22, false);
  for (const a of all) {
    assert.equal(a.rest.stage, "sleep");
    const bed = bedPosition(a);
    assert.ok(Math.abs(a.x - bed.x) < 1e-10);
    assert.ok(Math.abs(a.z - bed.z) < 1e-10);
    assert.ok(cloudSleeper(a) ? a.rest.y > 3 : a.rest.y < 1);
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
test("a shed visitor comes out and goes back; reduced motion skips the hops", () => {
  const a = createAnimals().find((a) => a.species === "cow")!;
  stepRest(a, 0.1, 22, true);
  assert.equal(a.rest.stage, "sleep");
  visitFromShed(a);
  for (let i = 0; i < 30; i++) stepRest(a, 0.1, 22, false);
  assert.equal(a.rest.stage, "visit");
  assert.ok(a.z > 2.8);
  for (let i = 0; i < 60; i++) stepRest(a, 0.1, 22, false);
  assert.equal(a.rest.stage, "sleep");
  stepRest(a, 0.1, 9, true);
  assert.equal(a.rest.stage, "awake");
});
