import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { plantWilt, type World, type Plant } from "./simulation";
import { visitorHabitat } from "./visitors";
const ball = new THREE.SphereGeometry(1, 16, 10);
const materials = new Map<string, THREE.MeshStandardMaterial>();
function Part({
  p = [0, 0, 0],
  s,
  c,
  glow = false,
}: {
  p?: [number, number, number];
  s: [number, number, number];
  c: string;
  glow?: boolean;
}) {
  const key = c + glow;
  if (!materials.has(key))
    materials.set(
      key,
      new THREE.MeshStandardMaterial({
        color: c,
        roughness: 0.9,
        emissive: glow ? c : "#000000",
        emissiveIntensity: glow ? 2 : 0,
      }),
    );
  return (
    <mesh
      position={p}
      scale={s}
      geometry={ball}
      material={materials.get(key)}
      dispose={null}
      raycast={() => {}}
    />
  );
}
type Visit = {
  kind: "bird" | "snail" | "fireflies";
  host: Plant;
  seed: number;
};
const smooth = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};
function Guest({
  visit,
  world,
  done,
}: {
  visit: Visit;
  world: World;
  done: () => void;
}) {
  const root = useRef<THREE.Group>(null),
    wings = useRef<THREE.Group>(null),
    age = useRef(0);
  const host = world.plants.find((p) => p.id === visit.host.id) ?? visit.host;
  const habitat = visitorHabitat(world.plants, world.time, world.season);
  const valid =
    visit.kind === "bird"
      ? habitat.birds.some((p) => p.id === host.id)
      : visit.kind === "snail"
        ? habitat.snails.some((p) => p.id === host.id)
        : habitat.fireflies;
  useFrame((_, dt) => {
    if (document.hidden || !root.current) return;
    if (!valid) {
      done();
      return;
    }
    age.current += Math.min(dt, 0.1);
    const t = age.current,
      duration = visit.kind === "snail" ? 28 : 22;
    if (t > duration) {
      done();
      return;
    }
    const fade = Math.min(smooth(t), smooth(duration - t));
    root.current.scale.setScalar(fade);
    if (visit.kind === "bird") {
      const flight = world.reduced
        ? 0
        : t < 3
          ? 1 - smooth(t / 3)
          : t > duration - 3
            ? smooth((t - duration + 3) / 3)
            : 0;
      const perch =
        0.29 + (2.4 - plantWilt(host) * 0.2) * (0.18 + 0.82 * host.growth);
      root.current.position.set(
        host.x + flight * 7,
        perch + flight * 3,
        host.z - flight * 3,
      );
      root.current.rotation.y =
        visit.seed + (world.reduced ? 0 : Math.sin(t * 0.6) * 0.15);
      if (wings.current)
        wings.current.children.forEach((wing, i) => {
          wing.rotation.z =
            flight > 0 ? Math.sin(t * 18) * (i === 0 ? 1 : -1) * 0.8 : 0;
        });
    } else if (visit.kind === "snail") {
      root.current.position.set(host.x + 0.48, 0.36, host.z + 0.22);
      const snail = root.current.children[1];
      snail.position.x = world.reduced ? 0 : -0.23 + (0.46 * t) / duration;
    } else {
      root.current.children.forEach((fly, i) => {
        const phase = world.reduced ? i : t * 0.65 + i * 2.4 + visit.seed;
        fly.position.set(
          Math.sin(i * 2.4 + visit.seed) * 4.2 + Math.sin(phase) * 0.3,
          0.65 + (Math.sin(phase * 0.7) + 1) * 0.55,
          Math.cos(i * 2.4 + visit.seed) * 4.2 + Math.cos(phase) * 0.3,
        );
        fly.scale.setScalar(
          world.reduced ? 1 : 0.7 + Math.sin(t * 1.6 + i) * 0.3,
        );
      });
    }
  });
  if (!valid) return null;
  return (
    <group ref={root}>
      {visit.kind === "bird" ? (
        <>
          <Part p={[0, 0.105, 0]} s={[0.12, 0.105, 0.17]} c="#8eafad" />
          <Part p={[0, 0.14, 0.09]} s={[0.092, 0.09, 0.09]} c="#d7b799" />
          <Part p={[0, 0.235, 0.095]} s={[0.095, 0.09, 0.09]} c="#668b94" />
          <Part p={[0, 0.215, 0.2]} s={[0.035, 0.025, 0.065]} c="#d2a251" />
          <Part
            p={[0.074, 0.25, 0.135]}
            s={[0.014, 0.016, 0.012]}
            c="#263b39"
          />
          <Part
            p={[-0.074, 0.25, 0.135]}
            s={[0.014, 0.016, 0.012]}
            c="#263b39"
          />
          <Part p={[0, 0.12, -0.19]} s={[0.075, 0.035, 0.12]} c="#557482" />
          <group ref={wings}>
            {[-1, 1].map((sign) => (
              <group key={sign} position={[sign * 0.095, 0.14, 0]}>
                <Part s={[0.045, 0.07, 0.135]} c="#557482" />
              </group>
            ))}
          </group>
          {[-1, 1].map((sign) => (
            <Part
              key={sign}
              p={[sign * 0.045, 0.018, 0.04]}
              s={[0.016, 0.018, 0.05]}
              c="#826844"
            />
          ))}
        </>
      ) : visit.kind === "snail" ? (
        <>
          <Part s={[0.37, 0.035, 0.18]} c="#73915e" />
          <group position={[0, 0.06, 0]} scale={1.25}>
            <Part s={[0.12, 0.04, 0.045]} c="#c7b99b" />
            <Part p={[-0.02, 0.065, 0]} s={[0.07, 0.075, 0.058]} c="#b78f65" />
            <mesh position={[-0.02, 0.065, 0.054]} raycast={() => {}}>
              <torusGeometry args={[0.029, 0.008, 5, 16, Math.PI * 1.8]} />
              <meshStandardMaterial color="#806444" />
            </mesh>
            {[-1, 1].map((sign) => (
              <Part
                key={sign}
                p={[0.09, 0.06, sign * 0.026]}
                s={[0.009, 0.035, 0.009]}
                c="#9c9079"
              />
            ))}
          </group>
        </>
      ) : (
        Array.from({ length: 8 }, (_, i) => (
          <group key={i}>
            <Part s={[0.03, 0.04, 0.03]} c="#ededa0" glow />
            <mesh
              raycast={() => {}}
              geometry={ball}
              scale={0.085}
              dispose={null}
            >
              <meshBasicMaterial
                color="#ededa0"
                transparent
                opacity={0.15}
                depthWrite={false}
              />
            </mesh>
            <Part p={[0.023, 0.018, 0]} s={[0.025, 0.01, 0.016]} c="#b9caba" />
          </group>
        ))
      )}
    </group>
  );
}
export default function Visitors({ world }: { world: World }) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const wait = useRef(8 + Math.random() * 10);
  const habitat = visitorHabitat(world.plants, world.time, world.season);
  useFrame((_, dt) => {
    if (document.hidden || visit || !habitat.lush) return;
    wait.current -= Math.min(dt, 0.1);
    if (wait.current > 0) return;
    const kind = habitat.fireflies
      ? "fireflies"
      : habitat.birds.length && (!habitat.snails.length || Math.random() < 0.5)
        ? "bird"
        : habitat.snails.length
          ? "snail"
          : null;
    if (!kind) {
      wait.current = 5;
      return;
    }
    const choices =
      kind === "bird"
        ? habitat.birds
        : kind === "snail"
          ? habitat.snails
          : world.plants.filter((p) => p.growth >= 0.85);
    setVisit({
      kind,
      host: choices[Math.floor(Math.random() * choices.length)],
      seed: Math.random() * Math.PI * 2,
    });
  });
  return visit ? (
    <Guest
      visit={visit}
      world={world}
      done={() => {
        wait.current = 18 + Math.random() * 25;
        setVisit(null);
      }}
    />
  ) : null;
}
