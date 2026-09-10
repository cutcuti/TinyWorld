import { SPECIES } from "./wildlife";
import type { Species } from "./wildlife";
import {
  initialWorld,
  canPlant,
  LIMIT,
  type Plant,
  type World,
} from "./simulation";
export const KEY = "little-living-world-v1";
export const FREE_KEY = "little-living-world-free-v1",
  MODE_KEY = "little-living-world-mode";
const bounded = (n: unknown, max: number) =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= max;
export function loadWorld(selected?: World["mode"]): World {
  let mode: World["mode"] = selected ?? "garden";
  try {
    if (!selected && localStorage.getItem(MODE_KEY) === "free") mode = "free";
    const raw = JSON.parse(
      localStorage.getItem(mode === "free" ? FREE_KEY : KEY) || "null",
    );
    if (
      raw?.version !== 1 ||
      !Array.isArray(raw.plants) ||
      raw.plants.length > LIMIT ||
      !bounded(raw.time, 23.9999)
    )
      return initialWorld(mode);
    const plants: Plant[] = [];
    for (const p of raw.plants) {
      if (
        typeof p?.id !== "string" ||
        plants.some((q) => q.id === p.id) ||
        !["tree", "flowers", "lilies", "lotus"].includes(p.kind) ||
        !bounded(p.growth, 1) ||
        !bounded(p.water, 8) ||
        !Number.isInteger(p.hue) ||
        !bounded(p.hue, 2) ||
        !canPlant(plants, p.x, p.z, p.kind)
      )
        return initialWorld(mode);
      plants.push({
        ...p,
        moisture: bounded(p.moisture, 1) ? p.moisture : 1,
        fruit: bounded(p.fruit, 3) ? p.fruit : p.kind === "tree" ? 1 : 0,
      });
    }
    const basket = { milk: 0, eggs: 0, fruit: 0 };
    for (const k of ["milk", "eggs", "fruit"] as const)
      if (Number.isInteger(raw.basket?.[k]) && bounded(raw.basket[k], 9999))
        basket[k] = raw.basket[k];
    const cooldowns: Record<string, number> = {};
    if (raw.cooldowns && typeof raw.cooldowns === "object")
      for (const [id, value] of Object.entries(raw.cooldowns)) {
        if (/^\d{1,3}$/.test(id) && bounded(value, 20))
          cooldowns[id] = value as number;
      }
    const animalSeeds: NonNullable<World["animalSeeds"]> = [];
    if (mode === "free" && Array.isArray(raw.animalSeeds)) {
      for (const a of raw.animalSeeds.slice(0, 20)) {
        if (
          Number.isInteger(a.id) &&
          a.id >= 100 &&
          a.id <= 999 &&
          !animalSeeds.some((b) => b.id === a.id) &&
          SPECIES.includes(a.species as Species) &&
          Number.isFinite(a.x) &&
          Number.isFinite(a.z) &&
          Math.hypot(a.x, a.z) < 5.5
        )
          animalSeeds.push({ id: a.id, species: a.species, x: a.x, z: a.z });
      }
    }
    return {
      version: 1,
      mode,
      animalSeeds: mode === "free" ? animalSeeds : null,
      plants,
      time: raw.time,
      paused: raw.paused === true,
      reduced: raw.reduced === true,
      season:
        Number.isInteger(raw.season) && bounded(raw.season, 3) ? raw.season : 0,
      basket,
      cooldowns,
    };
  } catch {
    return initialWorld(mode);
  }
}
