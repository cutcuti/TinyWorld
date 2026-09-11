import type { RefObject } from "react";
import * as THREE from "three";

const sphere = new THREE.SphereGeometry(1, 28, 20);
const coat = "#b9855c",
  hair = "#49352e",
  hoof = "#443c36";
const materials = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string) {
  if (!materials.has(color))
    materials.set(
      color,
      new THREE.MeshStandardMaterial({ color, roughness: 0.88 }),
    );
  return materials.get(color)!;
}
function Round({
  p,
  s,
  c = coat,
  rotation,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c?: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh
      position={p}
      scale={s}
      rotation={rotation}
      geometry={sphere}
      material={mat(c)}
      castShadow
      dispose={null}
    />
  );
}
function profile(points: [number, number][]) {
  return new THREE.CatmullRomCurve3(
    points.map(([r, y]) => new THREE.Vector3(r, y, 0)),
  )
    .getPoints(48)
    .map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
}
const body = new THREE.LatheGeometry(
  profile([
    [0, -0.59],
    [0.19, -0.49],
    [0.28, -0.32],
    [0.285, -0.1],
    [0.25, 0.15],
    [0.235, 0.35],
    [0.17, 0.48],
    [0, 0.54],
  ]),
  32,
);
body.rotateX(Math.PI / 2);
body.scale(1, 0.92, 1);
// A continuous tapered neck, with its crest swept forward toward the poll.
const neckProfile = profile([
  [0, 0],
  [0.22, 0.02],
  [0.26, 0.12],
  [0.23, 0.26],
  [0.18, 0.42],
  [0.135, 0.59],
  [0.12, 0.7],
  [0, 0.75],
]);
const neck = new THREE.LatheGeometry(neckProfile, 32);
const positions = neck.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const y = positions.getY(i);
  positions.setXYZ(i, positions.getX(i) * 0.82, y, positions.getZ(i) + y * 0.4);
}
neck.computeVertexNormals();
function strand(points: number[][], radius: number) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    ),
    28,
    radius,
    10,
    false,
  );
}
// A thin surface following the neck, with a softly scalloped lower edge.
// This replaces the oversized cylindrical mane and its visible open ends.
const mane = new THREE.BufferGeometry();
const maneVertices: number[] = [],
  maneIndices: number[] = [];
const rows = neckProfile.slice(5, -4),
  columns = 20;
rows.forEach((p, row) => {
  const taper = Math.min(1, (row + 1) / 6, (rows.length - row) / 5);
  for (let col = 0; col <= columns; col++) {
    const u = col / columns;
    const angle = Math.PI - 0.22 + (u - 0.5) * 1.55 * taper;
    const r = p.x + 0.009;
    const y = p.y + (row < 4 ? Math.sin(u * Math.PI * 6) * 0.009 : 0);
    maneVertices.push(
      Math.sin(angle) * r * 0.82,
      y,
      Math.cos(angle) * r + y * 0.4,
    );
    if (row < rows.length - 1 && col < columns) {
      const i = row * (columns + 1) + col;
      maneIndices.push(
        i,
        i + 1,
        i + columns + 1,
        i + 1,
        i + columns + 2,
        i + columns + 1,
      );
    }
  }
});
mane.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(maneVertices, 3),
);
mane.setIndex(maneIndices);
mane.computeVertexNormals();
const tail = strand(
  [
    [0, 0.76, -0.5],
    [0, 0.63, -0.62],
    [0.015, 0.43, -0.67],
    [0.055, 0.27, -0.7],
    [0.085, 0.22, -0.76],
  ],
  0.055,
);
// Taper each cross-section to a fine tip, avoiding the old blunt tube silhouette.
const tailPath = new THREE.CatmullRomCurve3(
  [
    [0, 0.76, -0.5],
    [0, 0.63, -0.62],
    [0.015, 0.43, -0.67],
    [0.055, 0.27, -0.7],
    [0.085, 0.22, -0.76],
  ].map((p) => new THREE.Vector3(...(p as [number, number, number]))),
);
const tailPositions = tail.attributes.position;
for (let row = 0; row <= 28; row++) {
  const t = row / 28,
    center = tailPath.getPointAt(t);
  const width = 0.5 + 0.65 * Math.sin(t * Math.PI);
  const taper = width * Math.min(1, (1 - t) * 5);
  for (let col = 0; col <= 10; col++) {
    const i = row * 11 + col;
    const p = new THREE.Vector3()
      .fromBufferAttribute(tailPositions, i)
      .sub(center)
      .multiplyScalar(taper)
      .add(center);
    tailPositions.setXYZ(i, p.x, p.y, p.z);
  }
}
tail.computeVertexNormals();
const forelock = strand(
  [
    [0, 0.15, -0.035],
    [0.025, 0.14, 0.06],
    [0.035, 0.07, 0.15],
    [0.02, 0.015, 0.2],
  ],
  0.055,
);

export default function HorseModel({
  headRef,
  legsRef,
  unicorn = false,
}: {
  unicorn?: boolean;
  headRef: RefObject<THREE.Group | null>;
  legsRef: RefObject<THREE.Group | null>;
}) {
  const coat = unicorn ? "#f4eee7" : "#b9855c";
  const hair = unicorn ? "#c9a6d5" : "#49352e";
  const hoof = unicorn ? "#cfae74" : "#443c36";
  return (
    <>
      <mesh
        position={[0, 0.68, 0]}
        geometry={body}
        material={mat(coat)}
        castShadow
        dispose={null}
      />
      <mesh geometry={tail} material={mat(hair)} castShadow dispose={null} />
      <group position={[0, 0.66, 0.25]} scale={[1, 0.84, 1]}>
        <mesh geometry={neck} material={mat(coat)} castShadow dispose={null} />
        <mesh geometry={mane} material={mat(hair)} castShadow dispose={null} />
      </group>
      <group ref={legsRef}>
        {[-1, 1, -1, 1].map((sign, i) => (
          <group key={i} position={[sign * 0.195, 0.58, i < 2 ? 0.32 : -0.34]}>
            <Round c={coat} p={[0, -0.115, 0]} s={[0.078, 0.19, 0.09]} />
            <Round c={coat} p={[0, -0.29, 0.008]} s={[0.052, 0.075, 0.06]} />
            <Round c={coat} p={[0, -0.39, 0.015]} s={[0.041, 0.14, 0.048]} />
            <Round p={[0, -0.47, 0.018]} s={[0.044, 0.055, 0.05]} c="#eee0c8" />
            <Round p={[0, -0.525, 0.04]} s={[0.067, 0.055, 0.085]} c={hoof} />
          </group>
        ))}
      </group>
      <group ref={headRef} position={[0, 1.215, 0.52]}>
        {unicorn && <mesh position={[0, 0.28, 0.15]} rotation={[0.25, 0, 0]} castShadow>
          <coneGeometry args={[0.055, 0.42, 16]} />
          <meshStandardMaterial color="#eed29a" metalness={0.25} roughness={0.4} />
        </mesh>}
        <group rotation={[-0.42, 0, 0]}>
          <Round c={coat} p={[0, 0, 0.035]} s={[0.145, 0.17, 0.21]} />
          <Round c={coat} p={[0, -0.035, 0.205]} s={[0.115, 0.12, 0.235]} />
          <Round p={[0, -0.065, 0.37]} s={[0.12, 0.085, 0.1]} c={unicorn ? "#e3c7d2" : "#d5ad89"} />
          <Round
            p={[0, 0.05, 0.205]}
            s={[0.032, 0.022, 0.15]}
            c="#f2e5cf"
            rotation={[0.16, 0, 0]}
          />
          {[-1, 1].map((sign) => (
            <group key={sign}>
              <Round c={coat}
                p={[sign * 0.115, 0.235, -0.035]}
                s={[0.05, 0.135, 0.065]}
                rotation={[0.12, 0, -sign * 0.2]}
              />
              <Round
                p={[sign * 0.115, 0.24, 0.015]}
                s={[0.025, 0.082, 0.016]}
                c="#83574b"
                rotation={[0.12, 0, -sign * 0.2]}
              />
              <Round
                p={[sign * 0.13, 0.025, 0.12]}
                s={[0.026, 0.032, 0.025]}
                c="#302c29"
              />
              <Round
                p={[sign * 0.147, 0.037, 0.128]}
                s={[0.007, 0.009, 0.008]}
                c="#fff4df"
              />
              <Round
                p={[sign * 0.093, -0.04, 0.411]}
                s={[0.017, 0.012, 0.012]}
                c="#75574b"
              />
            </group>
          ))}
          <mesh
            geometry={forelock}
            material={mat(hair)}
            castShadow
            dispose={null}
          />
        </group>
      </group>
    </>
  );
}
