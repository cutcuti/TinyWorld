import type { Animal } from "./wildlife";
export const SHED = { x: 3.9, z: 2.2 };
export type RestState = {
  stage: "awake" | "stretch" | "travel" | "sleep" | "visit" | "return" | "wake";
  timer: number;
  dayX: number;
  dayZ: number;
  fromX: number;
  fromZ: number;
  fromY: number;
  y: number;
};
export function cloudSleeper(a: Animal) {
  return ["horse", "sheep", "duck"].includes(a.species);
}
export function bedPosition(a: Animal) {
  if (!cloudSleeper(a)) return { ...SHED, y: 0.27 };
  const angle = a.id * 2.4;
  return {
    x: Math.sin(angle) * 4.1,
    z: Math.cos(angle) * 4.1,
    y: 3.1 + (a.id % 2) * 0.45,
  };
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
export function visitFromShed(a: Animal) {
  if (a.rest.stage === "sleep" && !cloudSleeper(a)) begin(a, "visit");
}
export function stepRest(
  a: Animal,
  dt: number,
  time: number,
  reduced: boolean,
) {
  const r = a.rest,
    d = Math.min(Math.max(dt, 0), 0.1),
    bed = bedPosition(a);
  const bedtime = time >= 19 || time < (a.species === "chicken" ? 5.7 : 6.3);
  if (!bedtime && r.stage !== "awake" && r.stage !== "wake") begin(a, "wake");
  if (bedtime && r.stage === "awake") {
    r.dayX = a.x;
    r.dayZ = a.z;
    begin(a, "stretch");
    a.chaseLeft = 0;
  }
  if (r.stage === "awake") return false;
  a.moving = false;
  a.scared = false;
  r.timer += d;
  if (reduced) {
    if (r.stage === "wake") {
      a.x = r.dayX;
      a.z = r.dayZ;
      r.y = 0.27;
      r.stage = "awake";
      return false;
    }
    if (r.stage === "visit") {
      a.x = SHED.x;
      a.z = SHED.z + 0.85;
      r.y = 0.27;
      if (r.timer > 5) begin(a, "return");
      return true;
    }
    a.x = bed.x;
    a.z = bed.z;
    r.y = bed.y;
    r.stage = "sleep";
    return true;
  }
  if (r.stage === "stretch") {
    if (r.timer > 1.6) begin(a, "travel");
    return true;
  }
  if (r.stage === "sleep") return true;
  const visiting = r.stage === "visit",
    waking = r.stage === "wake";
  const dest = visiting
    ? { x: SHED.x - 0.35, z: SHED.z + 0.95, y: 0.27 }
    : waking
      ? { x: r.dayX, z: r.dayZ, y: 0.27 }
      : bed;
  const duration = visiting
    ? 1.5
    : r.stage === "return"
      ? 1.5
      : waking
        ? 3
        : 4 + (a.id % 3) * 0.4;
  const t = Math.min(1, r.timer / duration),
    smooth = t * t * (3 - 2 * t);
  a.x = r.fromX + (dest.x - r.fromX) * smooth;
  a.z = r.fromZ + (dest.z - r.fromZ) * smooth;
  r.y =
    r.fromY +
    (dest.y - r.fromY) * smooth +
    Math.sin(t * Math.PI) * (visiting || r.stage === "return" ? 0.18 : 1.1);
  a.heading = Math.atan2(dest.x - r.fromX, dest.z - r.fromZ);
  a.moving = t < 1;
  if (t === 1) {
    if (visiting) {
      if (r.timer > 5) begin(a, "return");
    } else if (waking) {
      r.stage = "awake";
      r.y = 0.27;
    } else r.stage = "sleep";
  }
  return r.stage !== "awake";
}
