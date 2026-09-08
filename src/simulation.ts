export type Tool = "explore" | "plant" | "rain";
export type Plant = {
  id: string;
  x: number;
  z: number;
  kind: "tree" | "flowers";
  growth: number;
  water: number;
  hue: number;
};
export type World = {
  version: 1;
  plants: Plant[];
  time: number;
  paused: boolean;
  reduced: boolean;
};
export const ISLAND_RADIUS = 6;
export const PLANT_RADIUS = 5.6;
export const LIMIT = 85;
export const RADIUS = 1.35;
export const inWater = (x: number, z: number) =>
  ((x - 1.55) / 1.55) ** 2 + ((z - 0.65) / 1.05) ** 2 < 1.18;
export function canPlant(plants: Plant[], x: number, z: number) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    x * x + z * z < PLANT_RADIUS ** 2 &&
    !inWater(x, z) &&
    !plants.some((p) => Math.hypot(p.x - x, p.z - z) < 0.7) &&
    plants.length < LIMIT
  );
}
export function initialWorld(): World {
  return {
    version: 1,
    time: 10,
    paused: false,
    reduced:
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    plants: [
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
      hue: i % 3,
    })),
  };
}
export function advance(w: World, dt: number): World {
  const step = Math.min(Math.max(dt, 0), 1);
  return {
    ...w,
    time: w.paused ? w.time : (w.time + step * 0.065) % 24,
    plants: w.plants.map((p) => ({
      ...p,
      growth: Math.min(1, p.growth + step * (p.water > 0 ? 0.11 : 0.012)),
      water: Math.max(0, p.water - step),
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
