import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, SphereGeometry } from "three";
import type { World } from "./simulation";

const sphere = new SphereGeometry(1, 20, 14);
const egg = sphere.clone();
const vertices = egg.attributes.position;
for (let i = 0; i < vertices.count; i++) {
  const taper = 1 - vertices.getY(i) * 0.18;
  vertices.setX(i, vertices.getX(i) * taper);
  vertices.setZ(i, vertices.getZ(i) * taper);
}
egg.computeVertexNormals();
type Vec = [number, number, number];
function Soft({ p = [0, 0, 0], s, color }: { p?: Vec; s: Vec; color: string }) {
  return <mesh position={p} scale={s} geometry={sphere} dispose={null} castShadow raycast={() => {}}>
    <meshStandardMaterial color={color} roughness={0.9} />
  </mesh>;
}
function Rabbit({ position, cream, reduced, time }: { position: Vec; cream: boolean; reduced: boolean; time: number }) {
  const root = useRef<Group>(null);
  const age = useRef(0);
  // These shy visitors come out with the morning light and retreat at bedtime.
  const daylight = Math.min(1, Math.max(0, (time - 6) * 2), Math.max(0, (19 - time) * 2));
  useFrame((_, dt) => {
    if (!root.current || document.hidden) return;
    if (!reduced) age.current += Math.min(dt, 0.05);
    const t = age.current % 12;
    // Two little hops, followed by a long pause to sniff the flowers.
    const progress = reduced ? 0 : t < 3 ? t / 3 : t < 6 ? 1 : t < 9 ? 1 - (t - 6) / 3 : 0;
    const moving = !reduced && (t < 3 || (t >= 6 && t < 9));
    const smooth = progress * progress * (3 - 2 * progress);
    root.current.position.set(position[0] + smooth * 0.65, position[1] + (moving ? Math.sin(progress * Math.PI * 2) ** 2 * 0.12 : 0), position[2]);
    const turn = t < 3 ? Math.PI / 2 : t < 6 ? Math.PI / 2 + Math.PI * (t - 3) / 3 : t < 9 ? Math.PI * 1.5 : Math.PI * 1.5 + Math.PI * (t - 9) / 3;
    root.current.rotation.y = reduced ? 0.7 : turn;
  });
  const fur = cream ? "#e4ceb0" : "#eee8dc";
  return <group ref={root} position={position} scale={daylight} name="spring-rabbit">
    <Soft p={[0, 0.23, -0.05]} s={[0.2, 0.23, 0.29]} color={fur} />
    <Soft p={[0, 0.43, 0.16]} s={[0.17, 0.16, 0.16]} color={fur} />
    <Soft p={[0, 0.24, -0.33]} s={[0.11, 0.11, 0.1]} color="#fff7e9" />
    {[-1, 1].map(sign => <group key={sign}>
      <group position={[sign * 0.085, 0.56, 0.13]} rotation={[0, 0, sign * -0.16]}>
        <Soft p={[0, 0.17, 0]} s={[0.055, 0.22, 0.048]} color={fur} />
        <Soft p={[0, 0.18, 0.035]} s={[0.029, 0.155, 0.018]} color="#dcb2ac" />
      </group>
      <Soft p={[sign * 0.115, 0.055, 0.12]} s={[0.085, 0.055, 0.15]} color={fur} />
      <Soft p={[sign * 0.135, 0.465, 0.23]} s={[0.022, 0.027, 0.018]} color="#34352e" />
      <Soft p={[sign * 0.052, 0.39, 0.29]} s={[0.057, 0.043, 0.034]} color="#fff7ed" />
    </group>)}
    <Soft p={[0, 0.415, 0.315]} s={[0.026, 0.021, 0.018]} color="#c28d8e" />
  </group>;
}
const eggs: { p: Vec; color: string; tilt: number }[] = [
  { p: [-2.45, 0.46, 3.3], color: "#dea0b5", tilt: -0.15 },
  { p: [-2.08, 0.44, 3.4], color: "#edce83", tilt: 0.25 },
  { p: [2.4, 0.46, 3.7], color: "#a9bdde", tilt: -0.2 },
  { p: [2.72, 0.44, 3.53], color: "#c0abc9", tilt: 0.15 },
  { p: [-4.1, 0.45, -1.8], color: "#a8cbbb", tilt: 0.1 },
  { p: [3.4, 0.45, -2.8], color: "#e5b391", tilt: -0.25 },
];
export default function SpringVisitors({ world }: { world: World }) {
  if (world.season !== 0 || world.mode === "free") return null;
  return <group name="spring-visitors">
    {eggs.map(({ p, color, tilt }, i) => <group key={i} position={p} rotation={[0, i, tilt]} name="spring-egg">
      <mesh geometry={egg} scale={[0.145, 0.21, 0.145]} castShadow dispose={null} raycast={() => {}}>
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {Array.from({ length: 7 }, (_, j) => {
        const angle = j / 7 * Math.PI * 2;
        return <Soft key={j} p={[Math.sin(angle) * 0.144, 0, Math.cos(angle) * 0.144]} s={[0.025, 0.027, 0.025]} color="#fff6df" />;
      })}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.075, 0]} raycast={() => {}}>
        <torusGeometry args={[0.143, 0.012, 6, 28]} />
        <meshStandardMaterial color="#fff6df" />
      </mesh>
    </group>)}
    <Rabbit position={[-1.7, 0.27, 3.35]} cream={false} reduced={world.reduced} time={world.time} />
    <Rabbit position={[2.8, 0.27, 2.65]} cream reduced={world.reduced} time={world.time} />
  </group>;
}
