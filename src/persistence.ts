import {
  initialWorld,
  canPlant,
  LIMIT,
  type Plant,
  type World,
} from "./simulation";
export const KEY = "little-living-world-v1";
export function loadWorld(): World {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (
      raw?.version !== 1 ||
      !Array.isArray(raw.plants) ||
      raw.plants.length > LIMIT ||
      !Number.isFinite(raw.time) ||
      raw.time < 0 ||
      raw.time >= 24
    )
      return initialWorld();
    const plants: Plant[] = [];
    for (const p of raw.plants) {
      if (
        typeof p.id !== "string" ||
        !["tree", "flowers"].includes(p.kind) ||
        ![p.growth, p.water, p.hue].every(Number.isFinite) ||
        p.growth < 0 ||
        p.growth > 1 ||
        p.water < 0 ||
        p.water > 8 ||
        !canPlant(plants, p.x, p.z)
      )
        return initialWorld();
      plants.push(p);
    }
    return {
      version: 1,
      plants,
      time: raw.time,
      paused: raw.paused === true,
      reduced: raw.reduced === true,
    };
  } catch {
    return initialWorld();
  }
}
