import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import HorseModel from "./HorseModel";
import { ISLAND_RADIUS } from "./simulation";

export default function RainbowUnicorn({ reduced }: { reduced: boolean }) {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const legs = useRef<Group>(null);
  const age = useRef(0);
  useFrame((_, dt) => {
    if (!root.current || document.hidden) return;
    age.current += Math.min(dt, 0.1);
    const t = age.current;
    // One seven-second crossing; reduced motion leaves a quiet unicorn at the crest.
    const progress = reduced ? 0.5 : Math.min(1, t / 7);
    const angle = Math.PI * (1 - progress);
    const radius = ISLAND_RADIUS - 0.12;
    const tilt = Math.atan2(-0.78 * Math.cos(angle), Math.sin(angle));
    root.current.position.set(radius * Math.cos(angle) - Math.sin(tilt) * 0.1, radius * 0.78 * Math.sin(angle) + Math.cos(tilt) * 0.1, 0);
    root.current.rotation.z = tilt;
    const fade = reduced ? 1 : Math.min(1, t / 0.45, Math.max(0, (7.7 - t) / 0.5));
    root.current.scale.setScalar(0.65 * fade);
    if (legs.current) legs.current.children.forEach((leg, i) => {
      leg.rotation.x = reduced ? 0 : Math.sin(t * 9 + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.3;
    });
    if (head.current) head.current.rotation.x = reduced ? 0 : Math.sin(t * 9) * 0.035;
  });
  return <group ref={root} name="rainbow-unicorn" scale={0}>
    <group rotation={[0, Math.PI / 2, 0]}>
      <HorseModel headRef={head} legsRef={legs} unicorn />
    </group>
  </group>;
}
