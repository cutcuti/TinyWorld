import { bedPosition, stepRest, createRest } from "./rest";
import { animalSound } from "./audio";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  createAnimals,
  startChase,
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
  dog: "Dog",
  duck: "Duck",
};
function Creature({
  animal,
  plants,
  all,
  night,
  reduced,
  tool,
  onAnimal,
  time,
}: {
  time: number;
  animal: Animal;
  plants: Plant[];
  all: Animal[];
  night: boolean;
  reduced: boolean;
  tool: Tool;
  onAnimal: (id: number, species: Species) => void;
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
    cow = kind === "cow",
    dog = kind === "dog",
    duck = kind === "duck";
  const fur = dog
    ? animal.id % 2
      ? "#d2ad7b"
      : "#b27c4e"
    : horse
      ? "#aa7650"
      : goat
        ? "#c5ad88"
        : sheep
          ? "#f2e9d3"
          : "#f3eddd";
  const dark = horse ? "#55423b" : goat ? "#73624e" : "#4a4b43";
  const size = duck
    ? 0.75
    : chicken
      ? 0.65
      : horse
        ? 1.1
        : cow
          ? 1
          : dog
            ? 0.7
            : 0.85;
  const badge = useRef<THREE.Group>(null);
  const clicked = useRef(0);
  useFrame((_, dt) => {
    const resting = stepRest(animal, dt, time, reduced);
    if (!resting) stepAnimal(animal, dt, plants, all, night, reduced);
    if (!root.current) return;
    if (badge.current)
      badge.current.visible =
        animal.scared || animal.chaseLeft > 0 || clicked.current > 0;
    clicked.current = Math.max(0, clicked.current - dt);
    const sleeping = animal.rest.stage === "sleep";
    const stretch =
      animal.rest.stage === "stretch"
        ? Math.sin((animal.rest.timer / 1.6) * Math.PI)
        : 0;
    root.current.scale.set(
      size * (1 + stretch * 0.18),
      size * (1 - stretch * 0.23),
      size * (1 + stretch * 0.15),
    );
    root.current.position.set(
      animal.x,
      resting
        ? animal.rest.y - (sleeping && !duck ? 0.28 : 0)
        : duck
          ? 0.24
          : 0.27,
      animal.z,
    );
    if (legs.current) legs.current.visible = !sleeping;
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
      onClick={(e) => {
        if (tool !== "explore" || e.delta > 6) return;
        e.stopPropagation();
        startChase(animal);
        clicked.current = 1.4;
        onAnimal(animal.id, animal.species);
      }}
    >
      <group ref={badge} position={[0, 1.55, 0]} visible={false}>
        <Part
          p={[0, 0, 0]}
          s={[0.04, 0.13, 0.04]}
          c={dog ? "#f2be65" : "#f6e8a5"}
        />
        <Part p={[0, -0.21, 0]} s={[0.04, 0.04, 0.04]} c="#f6e8a5" />
      </group>
      {duck ? (
        <>
          <Part p={[0, 0.2, 0]} s={[0.27, 0.21, 0.38]} c="#d3c5a8" />
          <Part
            p={[0, 0.45, 0.24]}
            s={[0.15, 0.19, 0.16]}
            c={animal.id % 2 ? "#9b8160" : "#4a8066"}
          />
          <Part p={[0, 0.41, 0.4]} s={[0.12, 0.04, 0.14]} c="#d8aa55" />
          <Part p={[0, 0.37, 0.17]} s={[0.16, 0.045, 0.14]} c="#f4ecda" />
          {[-1, 1].map((sign) => (
            <Part
              key={sign}
              p={[sign * 0.12, 0.49, 0.3]}
              s={[0.025, 0.025, 0.025]}
              c="#283b33"
            />
          ))}
          <Part p={[0, 0.25, -0.36]} s={[0.13, 0.09, 0.16]} c="#685f4f" />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]}>
            <ringGeometry args={[0.43, 0.45, 32]} />
            <meshBasicMaterial color="#dcefe5" transparent opacity={0.5} />
          </mesh>
        </>
      ) : (
        <>
          {dog && (
            <>
              <Part
                p={[0, 0.72, -0.48]}
                s={[0.055, 0.25, 0.06]}
                c={fur}
                rotation={[0.7, 0, 0]}
              />
              <Part p={[0, 0.69, 0.3]} s={[0.25, 0.045, 0.23]} c="#5b827b" />
            </>
          )}
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
            {dog &&
              [-1, 1].map((sign) => (
                <Part
                  key={sign}
                  p={[sign * 0.19, 0.02, -0.04]}
                  s={[0.075, 0.23, 0.1]}
                  c="#694c37"
                />
              ))}
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
              s={
                chicken ? [0.14, 0.17, 0.14] : [0.19, 0.19, horse ? 0.3 : 0.23]
              }
              c={sheep ? "#887e69" : fur}
            />
            <Part
              p={[
                0,
                horse ? 0.13 : -0.055,
                chicken ? 0.2 : horse ? 0.29 : 0.24,
              ]}
              s={chicken ? [0.065, 0.095, 0.095] : [0.16, 0.1, 0.12]}
              c={chicken ? "#dc9c43" : cow ? "#d7a79c" : dark}
              pointed={chicken}
              rotation={chicken ? [Math.PI / 2, 0, 0] : undefined}
            />
            {[-1, 1].map((sign) => (
              <group key={sign}>
                <Part
                  p={[
                    sign * (chicken ? 0.108 : 0.163),
                    horse ? 0.28 : 0.035,
                    0.13,
                  ]}
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
                <Part
                  p={[0, -0.11, 0.16]}
                  s={[0.04, 0.065, 0.04]}
                  c="#bb6353"
                />
              </>
            )}
          </group>
        </>
      )}
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
  onAnimal,
  time,
  seeds,
}: {
  time: number;
  seeds: { id: number; species: Species; x: number; z: number }[] | null;
  plants: Plant[];
  night: boolean;
  reduced: boolean;
  tool: Tool;
  onAnimal: (id: number, species: Species) => void;
}) {
  const animals = useRef(createAnimals());
  const seedKey = seeds?.map((s) => s.id).join(",") ?? "garden";
  const lastSeeds = useRef<string | null>(null);
  if (lastSeeds.current !== seedKey) {
    lastSeeds.current = seedKey;
    if (seeds) {
      const originals = createAnimals();
      animals.current = seeds.map(
        (seed) =>
          animals.current.find(
            (a) => a.id === seed.id && a.species === seed.species,
          ) ?? {
            ...originals.find((a) => a.species === seed.species)!,
            ...seed,
            rest: createRest(seed.x, seed.z),
          },
      );
    } else animals.current = createAnimals();
  }
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (!document.hidden && !night) {
            const a =
              animals.current[
                Math.floor(Math.random() * animals.current.length)
              ];
            animalSound(a.species, true);
          }
          schedule();
        },
        6000 + Math.random() * 7000,
      );
    };
    schedule();
    return () => clearTimeout(timer);
  }, [night]);
  return (
    <group>
      {(night || time < 6.5) &&
        animals.current.map((a) => {
          const p = bedPosition(a);
          return (
            <group
              key={"bed" + a.id}
              position={[p.x, p.y - 0.07, p.z]}
              visible={night || time < 6.5}
            >
              {[-1, 0, 1].map((i) => (
                <Part
                  key={i}
                  p={[i * 0.38, 0, 0]}
                  s={[0.52, 0.16, 0.42]}
                  c="#dfe9ea"
                />
              ))}
              <Html
                center
                position={[0, 0.9, 0]}
                style={{ pointerEvents: "none" }}
              >
                <span className="sleep-label">z z z</span>
              </Html>
            </group>
          );
        })}
      {animals.current.map((animal) => (
        <Creature
          key={animal.id}
          animal={animal}
          time={time}
          plants={plants}
          all={animals.current}
          night={night}
          reduced={reduced}
          tool={tool}
          onAnimal={onAnimal}
        />
      ))}
    </group>
  );
}
