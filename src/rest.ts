import type { Animal } from "./wildlife";
import { inWater, type Plant } from "./simulation";
type Point = { x: number; z: number };
export type RestState = {
  stage:
    | "awake"
    | "stretch"
    | "travel"
    | "queue"
    | "board"
    | "lift"
    | "sleep"
    | "return"
    | "wake";
  timer: number;
  dayX: number;
  dayZ: number;
  fromX: number;
  fromZ: number;
  fromY: number;
  y: number;
  cloud: { x: number; y: number; z: number };
  path: Point[] | null;
};
function angle(a: Animal, all: Animal[]) {
  return (all.indexOf(a) / Math.max(1, all.length)) * Math.PI * 2;
}
export function bedPosition(a: Animal, all: Animal[] = [a]) {
  const t = angle(a, all);
  return {
    x: Math.sin(t) * 4.1,
    z: Math.cos(t) * 4.1,
    y: 3.1 + (a.id % 2) * 0.45,
  };
}
export function dockPosition(a: Animal, all: Animal[]) {
  const t = angle(a, all);
  return { x: Math.sin(t) * 6.3, z: Math.cos(t) * 6.3, y: 0.27 };
}
export function createRest(x: number, z: number): RestState {
  return {
    stage: "awake",
    timer: 0,
    dayX: x,
    dayZ: z,
    fromX: x,
    fromZ: z,
    fromY: 0.27,
    y: 0.27,
    cloud: { x, y: 3.1, z },
    path: null,
  };
}
function begin(a: Animal, stage: RestState["stage"]) {
  Object.assign(a.rest, {
    stage,
    timer: 0,
    fromX: a.x,
    fromZ: a.z,
    fromY: a.rest.y,
  });
}
const smooth = (v: number) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};
function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
// Bounded grid search keeps the walk on the island and away from trees and water.
export function groundPath(
  start: Point,
  end: Point,
  plants: Plant[],
  duck: boolean,
): Point[] | null {
  const spacing = 0.4,
    limit = 14,
    key = (x: number, z: number) => `${x},${z}`;
  const valid = (x: number, z: number) =>
    Math.hypot(x, z) < 5.65 &&
    (duck || !inWater(x, z)) &&
    !plants.some(
      (p) => p.kind !== "lotus" && Math.hypot(p.x - x, p.z - z) < 0.56,
    );
  const sx = Math.round(start.x / spacing),
    sz = Math.round(start.z / spacing);
  const queue: [[number, number]] | [number, number][] = [[sx, sz]];
  const previous = new Map<string, string | null>([[key(sx, sz), null]]);
  let found: string | null = null;
  for (let i = 0; i < queue.length && i < 900; i++) {
    const [x, z] = queue[i];
    if (Math.hypot(x * spacing - end.x, z * spacing - end.z) < 0.45) {
      found = key(x, z);
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        k = key(nx, nz);
      if (
        Math.abs(nx) > limit ||
        Math.abs(nz) > limit ||
        previous.has(k) ||
        !valid(nx * spacing, nz * spacing) ||
        !valid((x + dx * 0.5) * spacing, (z + dz * 0.5) * spacing)
      )
        continue;
      previous.set(k, key(x, z));
      queue.push([nx, nz]);
    }
  }
  if (!found) return null;
  const result: Point[] = [];
  let node: string | null = found;
  while (node) {
    const [x, z] = node.split(",").map(Number);
    result.push({ x: x * spacing, z: z * spacing });
    node = previous.get(node) ?? null;
  }
  result.reverse();
  result.shift();
  if (valid(end.x, end.z)) result.push(end);
  return result;
}
function walk(a: Animal, dt: number) {
  const path = a.rest.path;
  if (!path) return false;
  let distance = dt * 1.8;
  a.moving = false;
  while (path.length && distance > 0) {
    const target = path[0],
      dx = target.x - a.x,
      dz = target.z - a.z,
      len = Math.hypot(dx, dz);
    if (len < 0.01) {
      path.shift();
      continue;
    }
    const move = Math.min(distance, len);
    a.heading = Math.atan2(dx, dz);
    a.x += (dx / len) * move;
    a.z += (dz / len) * move;
    distance -= move;
    a.moving = true;
    if (move === len) path.shift();
  }
  a.rest.y = 0.27;
  return path.length === 0;
}
export function stepRest(
  a: Animal,
  dt: number,
  time: number,
  reduced: boolean,
  all: Animal[] = [a],
  plants: Plant[] = [],
) {
  const r = a.rest,
    d = Math.min(Math.max(dt, 0), 0.1),
    bed = bedPosition(a, all),
    dock = dockPosition(a, all),
    shore = { x: (dock.x * 5.3) / 6.3, z: (dock.z * 5.3) / 6.3 };
  const bedtime = time >= 19 || time < (a.species === "chicken" ? 5.7 : 6.3);
  if (!bedtime && !["awake", "return", "wake"].includes(r.stage)) {
    if (["stretch", "travel", "queue"].includes(r.stage)) {
      begin(a, "wake");
      r.path = groundPath(
        a,
        { x: r.dayX, z: r.dayZ },
        plants,
        a.species === "duck",
      );
    } else begin(a, "return");
  }
  if (bedtime && r.stage === "awake") {
    r.dayX = a.x;
    r.dayZ = a.z;
    r.cloud = { ...bed };
    begin(a, "stretch");
    a.chaseLeft = 0;
  }
  if (r.stage === "awake") return false;
  a.moving = false;
  a.scared = false;
  r.timer += d;
  a.phase += d;
  if (reduced) {
    if (r.stage === "wake" || r.stage === "return") {
      a.x = r.dayX;
      a.z = r.dayZ;
      r.y = 0.27;
      r.stage = "awake";
      return false;
    }
    a.x = bed.x;
    a.z = bed.z;
    r.y = bed.y;
    r.cloud = { ...bed };
    r.stage = "sleep";
    return true;
  }
  if (r.stage === "stretch") {
    const t = smooth(r.timer / 1.6);
    r.cloud = {
      x: mix(bed.x, dock.x, t),
      z: mix(bed.z, dock.z, t),
      y: mix(bed.y, dock.y, t),
    };
    if (r.timer >= 1.6) {
      r.cloud = { ...dock };
      r.path = groundPath(a, shore, plants, a.species === "duck");
      begin(a, "travel");
    }
    return true;
  }
  if (r.stage === "travel") {
    if (walk(a, d)) begin(a, "queue");
    return true;
  }
  if (r.stage === "queue") {
    const busy = all.some(
      (o) => o.rest.stage === "board" || o.rest.stage === "lift",
    );
    if (!busy && all.find((o) => o.rest.stage === "queue") === a)
      begin(a, "board");
    return true;
  }
  if (r.stage === "board") {
    const t = smooth(r.timer / 1.2);
    a.x = mix(r.fromX, dock.x, t);
    a.z = mix(r.fromZ, dock.z, t);
    r.y = 0.27;
    a.heading = Math.atan2(dock.x - r.fromX, dock.z - r.fromZ);
    a.moving = t < 1;
    if (t === 1) begin(a, "lift");
    return true;
  }
  if (r.stage === "lift") {
    const t = smooth(r.timer / 2);
    r.cloud = {
      x: mix(dock.x, bed.x, t),
      z: mix(dock.z, bed.z, t),
      y: mix(dock.y, bed.y, t),
    };
    a.x = r.cloud.x;
    a.z = r.cloud.z;
    r.y = r.cloud.y;
    if (t === 1) r.stage = "sleep";
    return true;
  }
  if (r.stage === "sleep") return true;
  if (r.stage === "return") {
    const t = smooth(r.timer / 2);
    r.cloud = {
      x: mix(r.fromX, dock.x, t),
      z: mix(r.fromZ, dock.z, t),
      y: mix(r.fromY, dock.y, t),
    };
    a.x = r.cloud.x;
    a.z = r.cloud.z;
    r.y = r.cloud.y;
    if (t === 1) {
      const path = groundPath(
        shore,
        { x: r.dayX, z: r.dayZ },
        plants,
        a.species === "duck",
      );
      r.path = path ? [shore, ...path] : null;
      begin(a, "wake");
    }
    return true;
  }
  if (r.stage === "wake" && walk(a, d)) {
    r.stage = "awake";
    return false;
  }
  return true;
}
