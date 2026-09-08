import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  createAnimals,
  stepAnimal,
  type Animal,
  type Species,
} from "./wildlife";
import type { Plant, Tool } from "./simulation";
const sphere = new THREE.SphereGeometry(1, 12, 8);
const cone = new THREE.ConeGeometry(1, 1, 8);
const materials = new Map<string, THREE.MeshStandardMaterial>();
function material(color: string) {
  if (!materials.has(color))
    materials.set(
      color,
      new THREE.MeshStandardMaterial({ color, roughness: 0.95 }),
    );
  return materials.get(color)!;
}
function Part({
  p,
  s,
  c,
  rotation,
  pointed = false,
}: {
  p: [number, number, number];
  s: [number, number, number];
  c: string;
  rotation?: [number, number, number];
  pointed?: boolean;
}) {
  return (
    <mesh
      position={p}
      scale={s}
      rotation={rotation}
      geometry={pointed ? cone : sphere}
      material={material(c)}
      castShadow
      dispose={null}
    />
  );
}
const names: Record<Species, string> = {
  chicken: "Chicken",
  cow: "Cow",
  goat: "Goat",
  sheep: "Sheep",
  horse: "Horse",
};
function Creature({
  animal,
  plants,
  all,
  night,
  reduced,
  tool,
}: {
  animal: Animal;
  plants: Plant[];
  all: Animal[];
  night: boolean;
  reduced: boolean;
  tool: Tool;
}) {
  const root = useRef<THREE.Group>(null),
    head = useRef<THREE.Group>(null),
    legs = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const kind = animal.species,
    chicken = kind === "chicken",
    horse = kind === "horse",
    sheep = kind === "sheep",
    goat = kind === "goat",
    cow = kind === "cow";
  const fur = horse
    ? "#aa7650"
    : goat
      ? "#c5ad88"
      : sheep
        ? "#f2e9d3"
        : "#f3eddd";
  const dark = horse ? "#55423b" : goat ? "#73624e" : "#4a4b43";
  const size = chicken ? 0.65 : horse ? 1.1 : cow ? 1 : 0.85;
  useFrame((_, dt) => {
    stepAnimal(animal, dt, plants, all, night, reduced);
    if (!root.current) return;
    root.current.position.set(animal.x, 0.27, animal.z);
    const target = animal.heading;
    root.current.rotation.y +=
      Math.atan2(
        Math.sin(target - root.current.rotation.y),
        Math.cos(target - root.current.rotation.y),
      ) * Math.min(1, dt * 5);
    const t = animal.phase;
    root.current.position.y += reduced
      ? 0
      : animal.moving
        ? Math.abs(Math.sin(t * 8)) * 0.018
        : 0;
    if (head.current)
      head.current.rotation.x = reduced
        ? 0
        : night
          ? 0.3
          : !animal.moving
            ? 0.16 + Math.sin(t * 2) * 0.13
            : 0;
    if (legs.current)
      legs.current.children.forEach((leg, i) => {
        leg.rotation.x = animal.moving
          ? Math.sin(t * 8 + (i % 2) * Math.PI) * 0.22
          : 0;
      });
  });
  return (
    <group
      ref={root}
      position={[animal.x, 0.27, animal.z]}
      rotation={[0, animal.heading, 0]}
      scale={size}
      onPointerOver={(e) => {
        if (tool === "explore") {
          e.stopPropagation();
          setHover(true);
        }
      }}
      onPointerOut={() => setHover(false)}
    >
      {chicken ? (
        <>
          <Part
            p={[0, 0.33, 0]}
            s={[0.23, 0.26, 0.32]}
            c={animal.id % 2 ? "#e7c498" : "#f3eddd"}
          />
          <Part
            p={[0, 0.44, -0.28]}
            s={[0.17, 0.2, 0.12]}
            c="#b39b79"
            rotation={[-0.6, 0, 0]}
          />
          {[-1, 1].map((sign) => (
            <Part
              key={sign}
              p={[sign * 0.2, 0.34, 0]}
              s={[0.065, 0.16, 0.21]}
              c="#e2d4b9"
            />
          ))}
        </>
      ) : (
        <>
          <Part
            p={[0, 0.6, 0]}
            s={[0.32, sheep ? 0.34 : 0.29, horse ? 0.55 : 0.47]}
            c={fur}
          />
          {cow && (
            <>
              {[-1, 1].map((sign) => (
                <Part
                  key={sign}
                  p={[sign * 0.3, 0.65, -0.08]}
                  s={[0.025, 0.19, 0.22]}
                  c="#51544a"
                />
              ))}
              <Part
                p={[0.06, 0.84, -0.24]}
                s={[0.18, 0.055, 0.16]}
                c="#51544a"
              />
            </>
          )}
          {sheep &&
            Array.from({ length: 12 }, (_, i) => (
              <Part
                key={i}
                p={[
                  Math.sin(i * 2.4) * 0.24,
                  0.61 + Math.cos(i * 2.4) * 0.16,
                  ((i % 4) - 0.5) * 0.19 - 0.2,
                ]}
                s={[0.2, 0.22, 0.21]}
                c={i % 3 ? "#f1e8d4" : "#e4dac4"}
              />
            ))}
          <Part
            p={[0, 0.68, -0.49]}
            s={[0.045, horse ? 0.29 : 0.17, 0.045]}
            c={dark}
            rotation={[-0.25, 0, 0]}
          />
        </>
      )}
      <group ref={legs}>
        {(chicken ? [-1, 1] : [-1, 1, -1, 1]).map((sign, i) => (
          <group
            key={i}
            position={[
              sign * (chicken ? 0.09 : 0.22),
              chicken ? 0.17 : 0.32,
              chicken ? 0 : i < 2 ? 0.29 : -0.29,
            ]}
          >
            <Part
              p={[0, -0.1, 0]}
              s={[
                chicken ? 0.025 : 0.055,
                chicken ? 0.11 : 0.22,
                chicken ? 0.025 : 0.065,
              ]}
              c={chicken ? "#d89c4d" : fur}
            />
            <Part
              p={[0, chicken ? -0.16 : -0.27, 0.025]}
              s={[chicken ? 0.04 : 0.07, 0.045, chicken ? 0.085 : 0.085]}
              c={chicken ? "#d89c4d" : dark}
            />
          </group>
        ))}
      </group>
      <group
        ref={head}
        position={[
          0,
          chicken ? 0.56 : horse ? 0.89 : 0.76,
          chicken ? 0.19 : 0.38,
        ]}
      >
        {horse && (
          <>
            <Part
              p={[0, -0.04, -0.04]}
              s={[0.16, 0.35, 0.19]}
              c={fur}
              rotation={[0.35, 0, 0]}
            />
            <Part
              p={[0, 0.1, -0.19]}
              s={[0.065, 0.32, 0.07]}
              c={dark}
              rotation={[0.35, 0, 0]}
            />
          </>
        )}
        <Part
          p={[0, horse ? 0.23 : 0, 0.06]}
          s={chicken ? [0.14, 0.17, 0.14] : [0.19, 0.19, horse ? 0.3 : 0.23]}
          c={sheep ? "#887e69" : fur}
        />
        <Part
          p={[0, horse ? 0.13 : -0.055, chicken ? 0.2 : horse ? 0.29 : 0.24]}
          s={chicken ? [0.065, 0.095, 0.095] : [0.16, 0.1, 0.12]}
          c={chicken ? "#dc9c43" : cow ? "#d7a79c" : dark}
          pointed={chicken}
          rotation={chicken ? [Math.PI / 2, 0, 0] : undefined}
        />
        {[-1, 1].map((sign) => (
          <group key={sign}>
            <Part
              p={[sign * (chicken ? 0.108 : 0.163), horse ? 0.28 : 0.035, 0.13]}
              s={[0.028, 0.033, 0.025]}
              c="#30372e"
            />
            {!chicken && (
              <Part
                p={[sign * 0.22, horse ? 0.42 : 0.15, 0.015]}
                s={[horse ? 0.055 : 0.12, horse ? 0.14 : 0.055, 0.065]}
                c={fur}
                rotation={[0, 0, sign * 0.3]}
              />
            )}{" "}
            {(goat || cow) && (
              <Part
                p={[sign * 0.115, 0.24, 0]}
                s={[0.045, goat ? 0.3 : 0.17, 0.045]}
                c="#d4c7a3"
                pointed
                rotation={[-0.25, 0, -sign * 0.2]}
              />
            )}
          </group>
        ))}
        {goat && (
          <Part
            p={[0, -0.23, 0.17]}
            s={[0.07, 0.19, 0.055]}
            c="#ece1c9"
            pointed
            rotation={[Math.PI, 0, 0]}
          />
        )}
        {chicken && (
          <>
            {[-0.06, 0.01, 0.08].map((z) => (
              <Part
                key={z}
                p={[0, 0.16, z]}
                s={[0.04, 0.08, 0.055]}
                c="#bb6353"
              />
            ))}
            <Part p={[0, -0.11, 0.16]} s={[0.04, 0.065, 0.04]} c="#bb6353" />
          </>
        )}
      </group>
      {hover && tool === "explore" && (
        <Html position={[0, 1.6, 0]} center style={{ pointerEvents: "none" }}>
          <span className="animal-label">
            {names[kind]}
            {night ? " · resting" : ""}
          </span>
        </Html>
      )}
    </group>
  );
}
export default function Animals({
  plants,
  night,
  reduced,
  tool,
}: {
  plants: Plant[];
  night: boolean;
  reduced: boolean;
  tool: Tool;
}) {
  const animals = useRef(createAnimals());
  return (
    <group>
      {animals.current.map((animal) => (
        <Creature
          key={animal.id}
          animal={animal}
          plants={plants}
          all={animals.current}
          night={night}
          reduced={reduced}
          tool={tool}
        />
      ))}
    </group>
  );
}
