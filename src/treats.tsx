import { useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { Tool } from "./simulation";

// A short interaction, never persisted or tied to hunger, inventory or progress.
export function useTreat(tool: Tool, awake: boolean, label: string, height = 1.3) {
  const left = useRef(0);
  const [show, setShow] = useState(false);
  useFrame((_, dt) => {
    if (document.hidden) return;
    if (!awake) left.current = 0;
    else left.current = Math.max(0, left.current - Math.min(dt, 0.1));
    if (show && left.current === 0) setShow(false);
  });
  return {
    left,
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (tool !== "treat" || e.delta > 6) return;
      e.stopPropagation();
      if (!awake || left.current > 0) return;
      left.current = 4;
      setShow(true);
    },
    feedback: show ? <group>
      <mesh position={[0, label === "Horse" ? 1.15 : label === "Duck" ? 0.34 : height * 0.36, label === "Horse" ? 0.92 : 0.48]} scale={[0.055, 0.04, 0.065]} raycast={() => {}}>
        <sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={label === "Dog" ? "#c5a16d" : "#dfa561"} />
      </mesh>
      <Html position={[0, height, 0]} center style={{ pointerEvents: "none" }}>
      <span className="animal-label treat-label" role="status" aria-label={`${label} enjoys a treat`}>A little nibble <span aria-hidden="true">♡</span></span>
    </Html></group> : null,
  };
}
