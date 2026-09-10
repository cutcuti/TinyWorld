import { test } from "node:test";
import assert from "node:assert/strict";
import { initialWorld } from "./simulation";
import { visitorHabitat } from "./visitors";
const plants = Array.from({ length: 10 }, (_, i) => ({
  ...initialWorld().plants[i % 8],
  id: String(i),
}));
test("visitors need ten mature healthy plants and appropriate hosts", () => {
  assert.equal(visitorHabitat(plants.slice(0, 9), 10, 0).lush, false);
  assert.equal(
    visitorHabitat(
      plants.map((p) => ({ ...p, growth: 0.4 })),
      10,
      0,
    ).lush,
    false,
  );
  assert.equal(
    visitorHabitat(
      plants.map((p) => ({ ...p, moisture: 0 })),
      10,
      0,
    ).lush,
    false,
  );
  const day = visitorHabitat(plants, 10, 0);
  assert.ok(day.birds.length > 0);
  assert.ok(day.birds.every((p) => p.kind === "tree"));
  assert.equal(day.snails.length, 10);
  assert.equal(day.fireflies, false);
  assert.equal(
    visitorHabitat(
      plants.map((p) => ({ ...p, kind: "flowers" as const })),
      10,
      0,
    ).birds.length,
    0,
  );
});
test("fireflies visit at dusk and night, with winter and daylight respected", () => {
  for (const time of [17.5, 20, 2]) {
    const h = visitorHabitat(plants, time, 0);
    assert.equal(h.fireflies, true);
    assert.equal(h.birds.length, 0);
    assert.equal(h.snails.length, 0);
  }
  assert.equal(visitorHabitat(plants, 12, 0).fireflies, false);
  assert.equal(visitorHabitat(plants, 20, 3).fireflies, false);
  assert.equal(visitorHabitat(plants, 12, 3).snails.length, 0);
  assert.ok(visitorHabitat(plants, 12, 3).birds.length > 0);
});
