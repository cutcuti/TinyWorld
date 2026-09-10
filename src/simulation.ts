import type { Species } from "./wildlife";
export type Tool = "explore" | "plant" | "rain" | "animal";
export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"] as const;
export type Season = 0 | 1 | 2 | 3;
export type Plant = {
  id: string;
  x: number;
  z: number;
  kind: "tree" | "flowers" | "lilies" | "lotus";
  growth: number;
  water: number;
  moisture?: number;
  hue: number;
  fruit?: number;
};
export type World = {
  version: 1;
  mode: "garden" | "free";
  animalSeeds: { id: number; species: Species; x: number; z: number }[] | null;
  plants: Plant[];
  time: number;
  paused: boolean;
  reduced: boolean;
  season: Season;
  basket: { milk: number; eggs: number; fruit: number };
  cooldowns: Record<string, number>;
};
export const ISLAND_RADIUS = 6,
  PLANT_RADIUS = 5.6,
  LIMIT = 85,
  RADIUS = 1.35;
export const inWater = (x: number, z: number) =>
  ((x - 1.55) / 1.55) ** 2 + ((z - 0.65) / 1.05) ** 2 < 1.18;
export function canPlant(
  plants: Plant[],
  x: number,
  z: number,
  kind: Plant["kind"] = "tree",
) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    x * x + z * z < PLANT_RADIUS ** 2 &&
    (kind === "lotus"
      ? ((x - 1.55) / 1.55) ** 2 + ((z - 0.65) / 1.05) ** 2 < 0.65
      : !inWater(x, z)) &&
    !plants.some((p) => Math.hypot(p.x - x, p.z - z) < 0.7) &&
    plants.length < LIMIT
  );
}
export function initialWorld(mode: World["mode"] = "garden"): World {
  return {
    version: 1,
    mode,
    animalSeeds: mode === "free" ? [] : null,
    time: 10,
    paused: false,
    reduced:
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    season: 0,
    basket: { milk: 0, eggs: 0, fruit: 0 },
    cooldowns: {},
    plants:
      mode === "free"
        ? []
        : [
            [-2.5, -1.6],
            [-0.8, -2.4],
            [1.1, -2.7],
            [-3, 0.5],
            [-1.7, 2],
            [0.1, 2.9],
            [3, -1.5],
            [-0.6, 0.1],
          ].map(([x, z], i) => ({
            id: `seed-${i}`,
            x,
            z,
            kind: i < 4 || i === 6 ? "tree" : "flowers",
            growth: 1,
            water: 0,
            moisture: 1,
            hue: i % 3,
            fruit: 2,
          })),
  };
}
// Pond plants have a permanent water source; land plants never die.
export function plantWilt(p: Plant) {
  return p.kind === "lotus"
    ? 0
    : Math.max(0, Math.min(1, (0.45 - (p.moisture ?? 1)) / 0.45));
}
export function advance(w: World, dt: number): World {
  const step = Math.min(Math.max(dt, 0), 1);
  return {
    ...w,
    time: w.paused ? w.time : (w.time + step * 0.065) % 24,
    cooldowns: Object.fromEntries(
      Object.entries(w.cooldowns).map(([id, t]) => [id, Math.max(0, t - step)]),
    ),
    plants: w.plants.map((p) => ({
      ...p,
      growth: Math.min(1, p.growth + step * (p.water > 0 ? 0.11 : 0.012)),
      water: Math.max(0, p.water - step),
      moisture:
        p.kind === "lotus"
          ? 1
          : Math.max(
              0,
              Math.min(
                1,
                (p.moisture ?? 1) +
                  Math.min(step, p.water) * 0.3 -
                  Math.max(0, step - p.water) / 420,
              ),
            ),
      fruit:
        p.kind === "tree" && p.growth >= 1
          ? Math.min(
              3,
              (p.fruit ?? 0) +
                (w.season === 3 ? 0 : step * (w.season === 2 ? 0.1 : 0.065)),
            )
          : 0,
    })),
  };
}
export function waterAt(w: World, x: number, z: number): World {
  return {
    ...w,
    plants: w.plants.map((p) =>
      Math.hypot(p.x - x, p.z - z) < RADIUS ? { ...p, water: 8 } : p,
    ),
  };
}
export function nextSeason(w: World): World {
  return { ...w, season: ((w.season + 1) % 4) as Season };
}
export function collectAnimal(
  w: World,
  id: number,
  species: string,
): { world: World; message: string } {
  const item =
    species === "cow" ? "milk" : species === "chicken" ? "eggs" : null;
  if (!item)
    return {
      world: w,
      message:
        species === "dog"
          ? "Zoomies! Everyone scatters. The horse stays cool."
          : species === "duck"
            ? "Quack! A happy little paddler."
            : "A little hello from your neighbor.",
    };
  const key = String(id),
    wait = w.cooldowns[key] ?? 0;
  if (wait > 0)
    return {
      world: w,
      message: `More ${item} in ${Math.ceil(wait)}s. Let them rest a little.`,
    };
  return {
    world: {
      ...w,
      basket: { ...w.basket, [item]: Math.min(9999, w.basket[item] + 1) },
      cooldowns: { ...w.cooldowns, [key]: item === "milk" ? 20 : 12 },
    },
    message:
      item === "milk" ? "+1 milk for your basket." : "+1 egg for your basket.",
  };
}
export function harvest(
  w: World,
  id: string,
): { world: World; message: string } {
  const p = w.plants.find((p) => p.id === id && p.kind === "tree");
  const count = Math.floor(p?.fruit ?? 0);
  if (!p || !count)
    return {
      world: w,
      message:
        w.season === 3
          ? "The orchard rests in winter."
          : "Fruit is growing. Come back in a little while.",
    };
  return {
    world: {
      ...w,
      basket: { ...w.basket, fruit: Math.min(9999, w.basket.fruit + count) },
      plants: w.plants.map((p) =>
        p.id === id ? { ...p, fruit: (p.fruit ?? 0) - count } : p,
      ),
    },
    message: `+${count} fruit, freshly picked.`,
  };
}

export function inviteAnimal(
  w: World,
  species: Species,
  x: number,
  z: number,
): { world: World; message: string } {
  const seeds = w.animalSeeds ?? [];
  const valid =
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    Math.hypot(x, z) < 5.4 &&
    (species === "duck"
      ? ((x - 1.55) / 1.55) ** 2 + ((z - 0.65) / 1.05) ** 2 < 0.6
      : !inWater(x, z)) &&
    !w.plants.some((p) => Math.hypot(p.x - x, p.z - z) < 0.9) &&
    !seeds.some((a) => Math.hypot(a.x - x, a.z - z) < 0.8);
  if (w.mode !== "free" || !valid)
    return {
      world: w,
      message:
        species === "duck"
          ? "Choose an open spot in the pond."
          : "Choose an open patch of grass.",
    };
  if (seeds.length >= 20)
    return {
      world: w,
      message: "Twenty neighbors is plenty for this little island.",
    };
  const id = Math.max(99, ...seeds.map((a) => a.id)) + 1;
  return {
    world: { ...w, animalSeeds: [...seeds, { id, species, x, z }] },
    message: `A ${species} joins your world.`,
  };
}
