import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, SphereGeometry } from "three";
import type { World } from "./simulation";

type Vec = [number, number, number];
const sphere = new SphereGeometry(1, 20, 14);
function Round({ p, s, color, rotation }: {
  p: Vec; s: Vec; color: string; rotation?: Vec;
}) {
  return <mesh position={p} scale={s} rotation={rotation} geometry={sphere} dispose={null} castShadow raycast={() => {}}>
    <meshStandardMaterial color={color} roughness={0.95} />
  </mesh>;
}
function Acorn({ position = [0, 0, 0] }: { position?: Vec }) {
  return <group position={position}>
    <Round p={[0, 0, 0]} s={[0.055, 0.073, 0.055]} color="#bb8951" />
    <Round p={[0, 0.042, 0]} s={[0.062, 0.032, 0.062]} color="#75563e" />
    <Round p={[0.005, 0.078, 0]} s={[0.012, 0.025, 0.012]} color="#75563e" />
  </group>;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
function Squirrel({ world, position, russet, delay }: {
  world: World; position: Vec; russet: boolean; delay: number;
}) {
  const root = useRef<Group>(null), paws = useRef<Group>(null), head = useRef<Group>(null);
  const age = useRef(delay);
  const daylight = Math.min(1, Math.max(0, (world.time - 6) * 2), Math.max(0, (19 - world.time) * 2));
  useFrame((_, dt) => {
    if (!root.current || document.hidden) return;
    if (!world.reduced) age.current += Math.min(dt, 0.05);
    const t = age.current % 16;
    // Travel, sit and nibble, then turn slowly before the return trip.
    const moving = t < 3 || (t >= 8 && t < 11);
    const progress = t < 3 ? smooth(t / 3) : t < 8 ? 1 : t < 11 ? 1 - smooth((t - 8) / 3) : 0;
    const turn = t < 6 ? 0 : t < 8 ? smooth((t - 6) / 2) : t < 14 ? 1 : 1 + smooth((t - 14) / 2);
    const bob = world.reduced || !moving ? 0 : Math.sin((t % 8) / 3 * Math.PI * 4) ** 2 * 0.045;
    if (!world.reduced) {
      root.current.position.set(position[0] + progress * 0.85, position[1] + bob, position[2]);
      root.current.rotation.y = Math.PI / 2 + turn * Math.PI;
    }
    const nibble = !world.reduced && !moving ? Math.sin(t * 4) * 0.012 : 0;
    if (paws.current) paws.current.position.y = nibble;
    if (head.current) head.current.rotation.x = nibble * 2;
  });
  const fur = russet ? "#b5764d" : "#a28c76";
  const tail = russet ? "#a76640" : "#8e7965";
  return <group ref={root} position={position} rotation={[0, 0.8, 0]} scale={daylight} name="autumn-squirrel">
    <Round p={[0, 0.24, -0.03]} s={[0.155, 0.24, 0.18]} color={fur} />
    <Round p={[0, 0.24, 0.105]} s={[0.11, 0.16, 0.075]} color="#e5ceb0" />
    <group rotation={[-0.17, 0, 0]}>
      <Round p={[0, 0.22, -0.22]} s={[0.115, 0.17, 0.15]} color={tail} />
      <Round p={[0, 0.44, -0.31]} s={[0.19, 0.31, 0.17]} color={tail} rotation={[-0.2, 0, 0]} />
      <Round p={[0, 0.68, -0.24]} s={[0.16, 0.19, 0.145]} color={tail} rotation={[0.55, 0, 0]} />
      <Round p={[0, 0.74, -0.13]} s={[0.11, 0.1, 0.12]} color={tail} />
    </group>
    <group ref={head} position={[0, 0.44, 0.1]}>
      <Round p={[0, 0, 0]} s={[0.14, 0.13, 0.14]} color={fur} />
      <Round p={[0, -0.045, 0.12]} s={[0.09, 0.065, 0.09]} color="#e5ceb0" />
      <Round p={[0, -0.025, 0.202]} s={[0.024, 0.022, 0.02]} color="#40362e" />
      {[-1, 1].map(sign => <group key={sign}>
        <Round p={[sign * 0.092, 0.135, -0.035]} s={[0.048, 0.09, 0.04]} color={fur} />
        <Round p={[sign * 0.092, 0.14, -0.005]} s={[0.024, 0.05, 0.014]} color="#dab49b" />
        <Round p={[sign * 0.117, 0.02, 0.074]} s={[0.022, 0.026, 0.02]} color="#302e29" />
        <Round p={[sign * 0.129, 0.03, 0.085]} s={[0.006, 0.007, 0.005]} color="#fff4e1" />
      </group>)}
    </group>
    {[-1, 1].map(sign => <Round key={sign} p={[sign * 0.115, 0.04, 0.055]} s={[0.085, 0.045, 0.12]} color={fur} />)}
    <group ref={paws}>
      <Acorn position={[0, 0.285, 0.205]} />
      {[-1, 1].map(sign => <Round key={sign} p={[sign * 0.066, 0.29, 0.19]} s={[0.043, 0.055, 0.05]} color={fur} />)}
    </group>
  </group>;
}
export default function AutumnVisitors({ world }: { world: World }) {
  if (world.season !== 2 || world.mode === "free") return null;
  return <group name="autumn-visitors">
    <Squirrel world={world} position={[-2.5, 0.27, 3.3]} russet delay={0} />
    <Squirrel world={world} position={[2.65, 0.27, 2.9]} russet={false} delay={4} />
    <Acorn position={[-2.8, 0.34, 3.05]} />
    <Acorn position={[-2.62, 0.34, 2.95]} />
    <Acorn position={[3.35, 0.34, 3.15]} />
  </group>;
}
