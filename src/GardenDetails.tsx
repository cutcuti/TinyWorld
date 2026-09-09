import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { inWater, type Plant, type Season } from "./simulation";
export const PALETTES = [
  {
    grass: "#92ad7a",
    sky: "#dae9eb",
    trees: ["#719779", "#cfb3bb", "#558775"],
  },
  {
    grass: "#a9b36d",
    sky: "#d7ebee",
    trees: ["#629363", "#8ea75a", "#44846c"],
  },
  {
    grass: "#b7a06c",
    sky: "#e9dfce",
    trees: ["#c5844f", "#d3a159", "#a46146"],
  },
  {
    grass: "#e1e9e6",
    sky: "#cedce6",
    trees: ["#c8dcd8", "#e9ede4", "#b8cccf"],
  },
];
function Blossom({
  lotus = false,
  color = "#f0e4c9",
}: {
  lotus?: boolean;
  color?: string;
}) {
  return (
    <group>
      {Array.from({ length: lotus ? 10 : 6 }, (_, i) => {
        const a = (i / (lotus ? 10 : 6)) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[
              Math.sin(a) * 0.11,
              lotus ? 0.09 : 0,
              Math.cos(a) * 0.11,
            ]}
            rotation={[Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5]}
            scale={[0.075, lotus ? 0.16 : 0.055, 0.15]}
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.035, 0]}>
        <sphereGeometry args={[0.065, 8, 6]} />
        <meshStandardMaterial color="#e9c875" />
      </mesh>
    </group>
  );
}
export function Lilies({ p }: { p: Plant }) {
  return (
    <group position={[p.x, 0.28, p.z]} scale={0.2 + 0.8 * p.growth}>
      {[-1, 0, 1].map((n, i) => (
        <group key={n} position={[n * 0.2, 0, Math.sin(i * 2) * 0.15]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.016, 0.024, 0.5, 5]} />
            <meshStandardMaterial color="#65895d" />
          </mesh>
          <mesh
            position={[0.08, 0.17, 0]}
            rotation={[0, 0, -0.6]}
            scale={[0.065, 0.19, 0.025]}
          >
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#779967" />
          </mesh>
          <group position={[0, 0.5, 0]}>
            <Blossom color={p.hue === 1 ? "#f2bbad" : "#fff2d6"} />
          </group>
        </group>
      ))}
    </group>
  );
}
export function PondFlowers({ season }: { season: Season }) {
  return (
    <group>
      {[
        [0.8, 0.3],
        [2.2, 0.15],
        [1.65, 1.28],
        [2.4, 1.05],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.3, z]}>
          <mesh rotation={[-Math.PI / 2, 0, i]}>
            <circleGeometry args={[0.27, 28, 0.2, Math.PI * 1.8]} />
            <meshStandardMaterial
              color={season === 3 ? "#7d9b91" : "#658d70"}
              side={THREE.DoubleSide}
            />
          </mesh>
          <group
            position={[0, i % 2 ? 0.03 : 0.1, 0]}
            scale={i % 2 ? 0.8 : 0.9}
          >
            <Blossom
              lotus={i % 2 === 0}
              color={i % 2 ? "#f9efcf" : "#eab4c3"}
            />
          </group>
        </group>
      ))}
    </group>
  );
}
export function SeasonParticles({
  season,
  reduced,
}: {
  season: Season;
  reduced: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null),
    dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    for (let i = 0; i < 80; i++) {
      const angle = i * 2.399,
        r = 1 + ((i * 17) % 43) / 10,
        x = Math.cos(angle) * r,
        z = Math.sin(angle) * r;
      dummy.position.set(
        x,
        season === 3
          ? reduced
            ? 1 + (i % 5)
            : 6 - ((clock.elapsedTime * 0.45 + i * 0.39) % 5.7)
          : 0.29,
        z,
      );
      if (season === 3) dummy.scale.setScalar(0.035);
      else if (inWater(x, z)) dummy.scale.setScalar(0);
      else dummy.scale.set(0.065, 0.13, 0.015);
      dummy.rotation.set(season === 3 ? 0 : -Math.PI / 2, 0, i);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  if (season !== 2 && season !== 3) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 80]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={season === 3 ? "#ffffff" : "#ae7045"} />
    </instancedMesh>
  );
}
export function Rainbow({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <group position={[0, 0.35, 0]} rotation={[0, -0.35, 0]}>
      {["#d98d91", "#e5ae77", "#ecda8a", "#98bd95", "#83b9ca", "#a59aca"].map(
        (color, i) => (
          <mesh key={color}>
            <torusGeometry args={[2.9 - i * 0.14, 0.085, 12, 80, Math.PI]} />
            <meshStandardMaterial
              color={color}
              roughness={0.4}
              metalness={0.05}
              emissive={color}
              emissiveIntensity={0.16}
            />
          </mesh>
        ),
      )}
    </group>
  );
}

export function PlantedLotus({ p }: { p: Plant }) {
  return (
    <group position={[p.x, 0.3, p.z]} scale={0.2 + 0.8 * p.growth}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 24, 0.2, Math.PI * 1.8]} />
        <meshStandardMaterial color="#6d977a" side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, 0.1, 0]}>
        <Blossom lotus color="#edb9c9" />
      </group>
    </group>
  );
}
