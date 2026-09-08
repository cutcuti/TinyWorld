import type { Animal } from "./wildlife";
export type RestState = {
  stage: "awake" | "stretch" | "travel" | "sleep" | "wake";
  timer: number;
  dayX: number;
  dayZ: number;
  fromX: number;
  fromZ: number;
  fromY: number;
  y: number;
};
export function bedPosition(a: Animal) {
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
  const waking = r.stage === "wake";
  const dest = waking ? { x: r.dayX, z: r.dayZ, y: 0.27 } : bed;
  const duration = waking ? 3 : 4 + (a.id % 3) * 0.4;
  const t = Math.min(1, r.timer / duration),
    smooth = t * t * (3 - 2 * t);
  a.x = r.fromX + (dest.x - r.fromX) * smooth;
  a.z = r.fromZ + (dest.z - r.fromZ) * smooth;
  r.y = r.fromY + (dest.y - r.fromY) * smooth + Math.sin(t * Math.PI) * 1.1;
  a.heading = Math.atan2(dest.x - r.fromX, dest.z - r.fromZ);
  a.moving = t < 1;
  if (t === 1) {
    if (waking) {
      r.stage = "awake";
      r.y = 0.27;
    } else r.stage = "sleep";
  }
  return r.stage !== "awake";
}
