import { createRest, type RestState } from "./rest";
import { inWater, type Plant } from "./simulation";
export type Species =
  "chicken" | "cow" | "goat" | "sheep" | "horse" | "dog" | "duck";
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
  chaseLeft: number;
  scared: boolean;
  rest: RestState;
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
  "dog",
  "dog",
  "duck",
  "duck",
];
export function createAnimals(): Animal[] {
  return SPECIES.map((species, id) => {
    const a = (id / 12) * Math.PI * 2;
    return {
      id,
      species,
      x: species === "duck" ? 1.55 + Math.sin(id) * 0.8 : Math.sin(a) * 4.85,
      z: species === "duck" ? 0.65 + Math.cos(id) * 0.5 : Math.cos(a) * 4.85,
      heading: a + Math.PI / 2,
      phase: id,
      moving: false,
      seed: id + 1,
      turnIn: 1 + id * 0.4,
      chaseLeft: 0,
      scared: false,
      rest: createRest(
        species === "duck" ? 1.55 + Math.sin(id) * 0.8 : Math.sin(a) * 4.85,
        species === "duck" ? 0.65 + Math.cos(id) * 0.5 : Math.cos(a) * 4.85,
      ),
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
    !others.some((a) => a.id !== id && Math.hypot(a.x - x, a.z - z) < 0.72)
  );
}
function random(a: Animal) {
  a.seed = (1664525 * a.seed + 1013904223) >>> 0;
  return a.seed / 4294967296;
}
export function startChase(a: Animal) {
  if (a.species === "dog") a.chaseLeft = 10;
}
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
  a.chaseLeft = Math.max(0, a.chaseLeft - d);
  const dog = others.find((o) => o.species === "dog" && o.chaseLeft > 0);
  a.scared = !!dog && a.species !== "horse" && a.species !== "dog";
  if (a.species === "duck") {
    if (reduced || (night && !a.scared)) return;
    a.phase += d * (a.scared ? 1.5 : 0.28);
    a.x = 1.55 + Math.sin(a.phase) * 0.9;
    a.z = 0.65 + Math.cos(a.phase) * 0.55;
    a.heading = Math.atan2(Math.cos(a.phase) * 0.9, -Math.sin(a.phase) * 0.55);
    a.moving = true;
    return;
  }
  if (!walkable(a.x, a.z, plants, others, a.id)) {
    let found = false;
    for (let ring = 1; ring <= 6 && !found; ring++)
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2,
          x = a.x + Math.sin(angle) * ring * 0.4,
          z = a.z + Math.cos(angle) * ring * 0.4;
        if (walkable(x, z, plants, others, a.id)) {
          a.x = x;
          a.z = z;
          found = true;
          break;
        }
      }
  }
  if (reduced || (night && !a.scared && a.chaseLeft === 0)) return;
  a.turnIn -= d;
  a.phase += d;
  if (a.scared && dog) {
    a.heading = Math.atan2(a.x - dog.x, a.z - dog.z);
  } else if (a.chaseLeft > 0) {
    const targets = others.filter(
      (o) => !["horse", "dog", "duck"].includes(o.species),
    );
    const target = targets[Math.floor(a.phase / 2) % targets.length];
    if (target) a.heading = Math.atan2(target.x - a.x, target.z - a.z);
  } else {
    if (a.turnIn <= 0) {
      a.heading += (random(a) - 0.5) * 1.8;
      a.turnIn = 2 + random(a) * 4;
    }
    if ((a.phase + a.id * 1.7) % 10 > 7) return;
  }
  const speed =
    a.chaseLeft > 0
      ? 1.1
      : a.scared
        ? 0.95
        : a.species === "chicken"
          ? 0.3
          : 0.22;
  // Try a few headings around obstacles so fleeing never leaves the island.
  for (const turn of [0, 0.7, -0.7, 1.5, -1.5, Math.PI]) {
    const heading = a.heading + turn,
      x = a.x + Math.sin(heading) * speed * d,
      z = a.z + Math.cos(heading) * speed * d;
    if (walkable(x, z, plants, others, a.id)) {
      a.x = x;
      a.z = z;
      a.heading = heading;
      a.moving = true;
      return;
    }
  }
  a.heading += 1.8;
  a.turnIn = 0.8;
}
