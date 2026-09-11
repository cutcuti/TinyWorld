import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, SphereGeometry, Vector3, Quaternion } from "three";
import type { World } from "./simulation";

type Vec = [number, number, number];
const sphere = new SphereGeometry(1, 20, 14);
function Round({ p, s, color, glow = false }: { p: Vec; s: Vec; color: string; glow?: boolean }) {
  return <mesh position={p} scale={s} geometry={sphere} dispose={null} castShadow raycast={() => {}}>
    <meshStandardMaterial color={color} roughness={0.85} emissive={color} emissiveIntensity={glow ? 1.4 : 0} />
  </mesh>;
}
function Twig({ from, to }: { from: Vec; to: Vec }) {
  const a = new Vector3(...from), b = new Vector3(...to);
  const direction = b.clone().sub(a);
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
  return <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={rotation} raycast={() => {}}>
    <cylinderGeometry args={[0.018, 0.027, direction.length(), 8]} />
    <meshStandardMaterial color="#c9ad83" />
  </mesh>;
}
function Reindeer({ world }: { world: World }) {
  const root = useRef<Group>(null), legs = useRef<Group>(null), head = useRef<Group>(null);
  const age = useRef(0);
  const visible = Math.min(1, Math.max(0, (world.time - 6) * 2), Math.max(0, (19 - world.time) * 2));
  useFrame((_, dt) => {
    if (document.hidden || !root.current || world.reduced) return;
    age.current += Math.min(dt, 0.05);
    const t = age.current;
    // A small, unhurried circuit on an open patch near the festive tree.
    const phase = t * 0.16;
    root.current.position.set(1.9 + Math.sin(phase) * 0.6, 0.27, 3.5 + Math.cos(phase) * 0.35);
    root.current.rotation.y = Math.atan2(0.6 * Math.cos(phase), -0.35 * Math.sin(phase));
    if (legs.current) legs.current.children.forEach((leg, i) => {
      leg.rotation.x = Math.sin(t * 4 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.17;
    });
    if (head.current) head.current.rotation.x = Math.sin(t * 1.4) * 0.035;
  });
  return <group ref={root} position={[1.9, 0.27, 3.85]} rotation={[0, 1, 0]} scale={visible} name="winter-reindeer">
    <Round p={[0, 0.52, 0]} s={[0.23, 0.25, 0.37]} color="#aa8060" />
    <Round p={[0, 0.72, 0.25]} s={[0.16, 0.3, 0.17]} color="#b58e6a" />
    <Round p={[0, 0.65, 0.36]} s={[0.115, 0.2, 0.055]} color="#e7d6b6" />
    <Round p={[0, 0.59, -0.39]} s={[0.075, 0.08, 0.13]} color="#e7d6b6" />
    <group ref={legs}>
      {[-1, 1, -1, 1].map((sign, i) => <group key={i} position={[sign * 0.15, 0.44, i < 2 ? 0.23 : -0.23]}>
        <Round p={[0, -0.17, 0]} s={[0.055, 0.22, 0.06]} color="#aa8060" />
        <Round p={[0, -0.39, 0.025]} s={[0.064, 0.05, 0.075]} color="#51483e" />
      </group>)}
    </group>
    <group ref={head} position={[0, 0.96, 0.29]}>
      <Round p={[0, 0, 0.04]} s={[0.15, 0.155, 0.2]} color="#b58e6a" />
      <Round p={[0, -0.045, 0.2]} s={[0.115, 0.095, 0.14]} color="#e7d6b6" />
      <Round p={[0, -0.02, 0.327]} s={[0.057, 0.052, 0.045]} color="#b85754" />
      {[-1, 1].map(sign => <group key={sign}>
        <Round p={[sign * 0.2, 0.11, -0.035]} s={[0.13, 0.06, 0.065]} color="#aa8060" />
        <Round p={[sign * 0.145, 0.025, 0.12]} s={[0.024, 0.028, 0.018]} color="#322f2b" />
        <Twig from={[sign * 0.09, 0.12, -0.05]} to={[sign * 0.18, 0.48, -0.11]} />
        <Twig from={[sign * 0.14, 0.3, -0.085]} to={[sign * 0.31, 0.38, -0.065]} />
        <Twig from={[sign * 0.17, 0.4, -0.1]} to={[sign * 0.09, 0.52, -0.07]} />
      </group>)}
    </group>
    <mesh position={[0, 0.83, 0.26]} rotation={[Math.PI / 2, 0, 0]} raycast={() => {}}>
      <torusGeometry args={[0.15, 0.042, 8, 24]} /><meshStandardMaterial color="#a64e4b" />
    </mesh>
    <mesh position={[0.12, 0.68, 0.4]} rotation={[0, 0, -0.12]} raycast={() => {}}>
      <boxGeometry args={[0.09, 0.27, 0.035]} /><meshStandardMaterial color="#a64e4b" />
    </mesh>
  </group>;
}
export default function WinterVisitors({ world }: { world: World }) {
  if (world.season !== 3 || world.mode === "free") return null;
  const night = world.time < 6 || world.time >= 19;
  return <group name="winter-visitors">
    <Reindeer world={world} />
    <group position={[-2.5, 0.27, 3.3]} name="christmas-tree">
      <mesh position={[0, 0.2, 0]} castShadow raycast={() => {}}>
        <cylinderGeometry args={[0.085, 0.1, 0.4, 10]} /><meshStandardMaterial color="#876e54" />
      </mesh>
      {[0, 1, 2].map(i => <group key={i}>
        <mesh position={[0, 0.63 + i * 0.37, 0]} castShadow raycast={() => {}}>
          <coneGeometry args={[0.65 - i * 0.16, 0.9 - i * 0.12, 24]} />
          <meshStandardMaterial color={i === 1 ? "#416e5a" : "#365e4b"} />
        </mesh>
        <mesh position={[0, 0.74 + i * 0.37, 0]} raycast={() => {}}>
          <coneGeometry args={[0.48 - i * 0.125, 0.65 - i * 0.08, 24]} />
          <meshStandardMaterial color="#ecede0" />
        </mesh>
        {Array.from({ length: 7 }, (_, j) => {
          const angle = j / 7 * Math.PI * 2 + i * 0.7;
          const radius = 0.51 - i * 0.14;
          return <Round key={j} p={[Math.cos(angle) * radius, 0.4 + i * 0.4, Math.sin(angle) * radius]} s={[0.044, 0.044, 0.044]} color={j % 3 === 0 ? "#c56961" : "#f1d9a2"} glow={night && j % 3 !== 0} />;
        })}
      </group>)}
      <group position={[0, 1.79, 0]}>
        {[0, 1, 2, 3, 4].map(i => <mesh key={i} rotation={[0, 0, i * Math.PI * 2 / 5]} raycast={() => {}}>
          <coneGeometry args={[0.07, 0.26, 3]} /><meshStandardMaterial color="#e8c781" emissive="#e8c781" emissiveIntensity={night ? 1.3 : 0.2} />
        </mesh>)}
      </group>
      {[[-0.55, 0.15, 0.45], [0.42, 0.12, 0.5]].map((p, i) => <group key={i} position={p as Vec}>
        <mesh castShadow raycast={() => {}}><boxGeometry args={[0.3, 0.24, 0.28]} /><meshStandardMaterial color={i ? "#91a99a" : "#b86762"} /></mesh>
        <mesh raycast={() => {}}><boxGeometry args={[0.055, 0.25, 0.29]} /><meshStandardMaterial color="#eddbb2" /></mesh>
        <mesh raycast={() => {}}><boxGeometry args={[0.31, 0.25, 0.045]} /><meshStandardMaterial color="#eddbb2" /></mesh>
      </group>)}
    </group>
  </group>;
}
