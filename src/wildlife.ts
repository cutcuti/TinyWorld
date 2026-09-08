import { inWater, type Plant } from "./simulation";
export type Species = "chicken" | "cow" | "goat" | "sheep" | "horse";
export type Animal = {
  id: number;
  species: Species;
  x: number;
  z: number;
  heading: number;
  phase: number;
  moving: boolean;
  seed: number;
  turnIn: number;
};
export const SPECIES: Species[] = [
  "horse",
  "sheep",
  "chicken",
  "cow",
  "goat",
  "chicken",
  "sheep",
  "cow",
  "goat",
  "chicken",
];
export function createAnimals(): Animal[] {
  return SPECIES.map((species, id) => {
    const a = (id / SPECIES.length) * Math.PI * 2;
    return {
      id,
      species,
      x: Math.sin(a) * 4.85,
      z: Math.cos(a) * 4.85,
      heading: a + Math.PI / 2,
      phase: id,
      moving: false,
      seed: id + 1,
      turnIn: 1 + id * 0.4,
    };
  });
}
export function walkable(
  x: number,
  z: number,
  plants: Plant[],
  others: Animal[],
  id: number,
) {
  return (
    Math.hypot(x, z) < 5.45 &&
    !inWater(x, z) &&
    !plants.some((p) => Math.hypot(p.x - x, p.z - z) < 0.85) &&
    !others.some((a) => a.id !== id && Math.hypot(a.x - x, a.z - z) < 0.9)
  );
}
function random(a: Animal) {
  a.seed = (1664525 * a.seed + 1013904223) >>> 0;
  return a.seed / 4294967296;
}
// Small bounded local movement: no pathfinding or unbounded creature spawning.
export function stepAnimal(
  a: Animal,
  dt: number,
  plants: Plant[],
  others: Animal[],
  night: boolean,
  reduced: boolean,
) {
  const d = Math.min(Math.max(dt, 0), 0.1);
  a.moving = false;
  // New planting or an older saved garden can occupy an animal's starting spot.
  if (!walkable(a.x, a.z, plants, others, a.id)) {
    let found = false;
    for (let ring = 1; ring <= 6 && !found; ring++) {
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const x = a.x + Math.sin(angle) * ring * 0.4;
        const z = a.z + Math.cos(angle) * ring * 0.4;
        if (walkable(x, z, plants, others, a.id)) {
          a.x = x;
          a.z = z;
          found = true;
          break;
        }
      }
    }
  }
  if (reduced || night) return;
  a.turnIn -= d;
  if (a.turnIn <= 0) {
    a.heading += (random(a) - 0.5) * 1.8;
    a.turnIn = 2 + random(a) * 4;
  }
  a.phase += d;
  if ((a.phase + a.id * 1.7) % 10 > 7) return;
  const speed = a.species === "chicken" ? 0.3 : 0.22;
  const x = a.x + Math.sin(a.heading) * speed * d,
    z = a.z + Math.cos(a.heading) * speed * d;
  if (walkable(x, z, plants, others, a.id)) {
    a.x = x;
    a.z = z;
    a.moving = true;
  } else {
    a.heading += 1.8;
    a.turnIn = 0.8;
  }
}
