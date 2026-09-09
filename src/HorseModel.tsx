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
const neck = new THREE.LatheGeometry(
  profile([
    [0, 0],
    [0.22, 0.02],
    [0.26, 0.12],
    [0.23, 0.26],
    [0.18, 0.42],
    [0.135, 0.59],
    [0.12, 0.7],
    [0, 0.75],
  ]),
  32,
);
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
// The mane hugs one side of the crest rather than protruding like a rod.
const mane = strand(
  [
    [0.025, 0.69, 0.18],
    [0.055, 0.57, 0.055],
    [0.1, 0.4, -0.075],
    [0.15, 0.23, -0.17],
    [0.17, 0.08, -0.2],
  ],
  0.09,
);
const tail = strand(
  [
    [0, 0.74, -0.48],
    [0, 0.66, -0.61],
    [0.015, 0.44, -0.68],
    [0.06, 0.2, -0.7],
    [0.1, 0.14, -0.66],
  ],
  0.075,
);
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
}: {
  headRef: RefObject<THREE.Group | null>;
  legsRef: RefObject<THREE.Group | null>;
}) {
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
      <group position={[0, 0.66, 0.25]}>
        <mesh geometry={neck} material={mat(coat)} castShadow dispose={null} />
        <mesh geometry={mane} material={mat(hair)} castShadow dispose={null} />
      </group>
      <group ref={legsRef}>
        {[-1, 1, -1, 1].map((sign, i) => (
          <group key={i} position={[sign * 0.195, 0.58, i < 2 ? 0.32 : -0.34]}>
            <Round p={[0, -0.115, 0]} s={[0.078, 0.19, 0.09]} />
            <Round p={[0, -0.29, 0.008]} s={[0.052, 0.075, 0.06]} />
            <Round p={[0, -0.39, 0.015]} s={[0.041, 0.14, 0.048]} />
            <Round p={[0, -0.47, 0.018]} s={[0.044, 0.055, 0.05]} c="#eee0c8" />
            <Round p={[0, -0.525, 0.04]} s={[0.067, 0.055, 0.085]} c={hoof} />
          </group>
        ))}
      </group>
      <group ref={headRef} position={[0, 1.32, 0.52]}>
        <group rotation={[-0.42, 0, 0]}>
          <Round p={[0, 0, 0.035]} s={[0.145, 0.17, 0.21]} />
          <Round p={[0, -0.035, 0.205]} s={[0.115, 0.12, 0.235]} />
          <Round p={[0, -0.065, 0.37]} s={[0.12, 0.085, 0.1]} c="#d5ad89" />
          <Round
            p={[0, 0.05, 0.205]}
            s={[0.032, 0.022, 0.15]}
            c="#f2e5cf"
            rotation={[0.16, 0, 0]}
          />
          {[-1, 1].map((sign) => (
            <group key={sign}>
              <Round
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
