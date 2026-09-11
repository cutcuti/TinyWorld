import {
  PALETTES,
  PlantedLotus,
  Lilies,
  PondFlowers,
  SeasonParticles,
  Rainbow,
} from "./GardenDetails";
import type { Species } from "./wildlife";
import Animals from "./Animals";
import Visitors from "./CritterVisitors";
import SpringVisitors from "./SpringVisitors";
import WinterVisitors from "./WinterVisitors";
import AutumnVisitors from "./AutumnVisitors";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import {
  Billboard,
  Html,
  OrbitControls,
  ContactShadows,
  Sparkles,
  Stars,
} from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitImpl } from "three-stdlib";
import {
  canPlant,
  plantWilt,
  inviteAnimal,
  RADIUS,
  type Plant,
  type Tool,
  type World,
} from "./simulation";
type Props = {
  world: World;
  onAnimal: (id: number, species: Species) => void;
  onHarvest: (id: string) => void;
  rainbow: boolean;
  tool: Tool;
  species: Plant["kind"];
  animalSpecies: Species;
  cursor: [number, number] | null;
  setCursor: (p: [number, number] | null) => void;
  act: (x: number, z: number) => void;
  rain: [number, number] | null;
  view: number;
  canvasRef: (c: HTMLCanvasElement) => void;
};
function Pebble({
  position,
  scale = 1,
  color = "#91a6a0",
  tool,
  reduced,
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  tool: Tool;
  reduced: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const taps = useRef(0),
    age = useRef(0),
    cooldown = useRef(0);
  const [awake, setAwake] = useState(false);
  useFrame((_, dt) => {
    if (document.hidden) return;
    const d = Math.min(dt, 0.1);
    cooldown.current = Math.max(0, cooldown.current - d);
    if (awake) {
      age.current += d;
      if (age.current >= 8) setAwake(false);
    }
    if (root.current) {
      const target = scale * (awake ? 1.65 : 1);
      const size = reduced
        ? target
        : THREE.MathUtils.lerp(
            root.current.scale.x,
            target,
            1 - Math.exp(-d * 7),
          );
      root.current.scale.setScalar(size);
      root.current.rotation.z =
        awake && !reduced ? Math.sin(age.current * 3) * 0.12 : 0;
    }
  });
  return (
    <group
      ref={root}
      position={position}
      scale={scale}
      onClick={(e) => {
        if (tool !== "explore" || e.delta > 6) return;
        e.stopPropagation();
        if (awake || cooldown.current > 0) return;
        taps.current++;
        if (taps.current === 10) {
          taps.current = 0;
          age.current = 0;
          cooldown.current = 28;
          setAwake(true);
        }
      }}
    >
      <mesh scale={[1, 0.7, 0.8]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {awake && (
        <Billboard lockX lockZ>
          {[-1, 1].map((sign) => (
            <group key={sign} position={[sign * 0.3, 0.25, 0.74]}>
              <mesh scale={[0.2, 0.22, 0.09]}>
                <sphereGeometry args={[1, 12, 8]} />
                <meshStandardMaterial color="#f8f0db" />
              </mesh>
              <mesh position={[0, 0, 0.08]} scale={[0.085, 0.11, 0.04]}>
                <sphereGeometry args={[1, 10, 8]} />
                <meshStandardMaterial color="#293c37" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.05, 0.8]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.2, 0.035, 6, 20, Math.PI]} />
            <meshStandardMaterial color="#293c37" />
          </mesh>
          <group position={[0, 0.65, 0]} rotation={[0, 0, -0.12]}>
            <mesh>
              <cylinderGeometry args={[0.78, 0.78, 0.09, 16]} />
              <meshStandardMaterial color="#3f4a54" />
            </mesh>
            <mesh position={[0, 0.36, 0]}>
              <cylinderGeometry args={[0.47, 0.5, 0.68, 16]} />
              <meshStandardMaterial color="#3f4a54" />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.51, 0.51, 0.15, 16]} />
              <meshStandardMaterial color="#d4ac83" />
            </mesh>
          </group>
          <Html center position={[0, 2.2, 0]} style={{ pointerEvents: "none" }}>
            <span className="animal-label">A distinguished pebble.</span>
          </Html>
        </Billboard>
      )}
    </group>
  );
}
function Tree({
  p,
  reduced,
  season,
  tool,
  onHarvest,
}: {
  p: Plant;
  reduced: boolean;
  season: World["season"];
  tool: Tool;
  onHarvest: (id: string) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.rotation.z = reduced
        ? 0
        : Math.sin(clock.elapsedTime * 0.7 + p.x) * 0.018;
  });
  const s = 0.18 + 0.82 * p.growth;
  const wilt = plantWilt(p);
  const leafColor = new THREE.Color(PALETTES[season].trees[p.hue % 3]).lerp(
    new THREE.Color("#a8a174"),
    wilt * 0.5,
  );
  return (
    <group
      position={[p.x, 0.29, p.z]}
      scale={s}
      onClick={(e) => {
        if (tool === "explore" && e.delta < 6) {
          e.stopPropagation();
          onHarvest(p.id);
        }
      }}
    >
      <group ref={ref}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.15, 1.3, 7]} />
          <meshStandardMaterial color="#88705c" />
        </mesh>
        {[
          [0, 1.55, 0, 0.8],
          [-0.42, 1.22, 0.08, 0.55],
          [0.43, 1.38, 0.1, 0.58],
          [0.04, 1.9, -0.08, 0.5],
        ].map(([x, y, z, r], i) => (
          <mesh
            key={i}
            position={[x, y - wilt * 0.2, z]}
            scale={[1, 1 - wilt * 0.23, 1]}
            castShadow
          >
            <icosahedronGeometry args={[r, 2]} />
            <meshStandardMaterial color={leafColor} roughness={1} />
          </mesh>
        ))}
      </group>
      {p.kind === "tree" &&
        p.growth >= 1 &&
        Array.from({ length: Math.floor(p.fruit ?? 0) }, (_, i) => (
          <group
            key={i}
            position={[
              Math.sin(i * 2.4) * 0.62,
              1.25 + (i % 2) * 0.4 - wilt * 0.2,
              Math.cos(i * 2.4) * 0.6,
            ]}
          >
            <mesh castShadow>
              <sphereGeometry args={[0.14, 10, 8]} />
              <meshStandardMaterial
                color={season === 2 ? "#d98e4f" : "#cb6555"}
              />
            </mesh>
            <mesh position={[0, 0.14, 0]} rotation={[0, 0, 0.25]}>
              <cylinderGeometry args={[0.013, 0.013, 0.1, 5]} />
              <meshStandardMaterial color="#76583e" />
            </mesh>
          </group>
        ))}
      {p.water > 0 && (
        <Sparkles
          count={5}
          scale={[0.9, 1.5, 0.9]}
          position={[0, 1, 0]}
          color="#c9eeff"
          size={3}
          speed={reduced ? 0 : 0.4}
        />
      )}
    </group>
  );
}
function Flowers({ p }: { p: Plant }) {
  const wilt = plantWilt(p);
  return (
    <group position={[p.x, 0.28, p.z]} scale={0.15 + 0.85 * p.growth}>
      {Array.from({ length: 5 }, (_, i) => {
        const x = Math.sin(i * 2.4) * 0.26,
          z = Math.cos(i * 2.4) * 0.26,
          h = 0.28 + (i % 3) * 0.07;
        return (
          <group
            key={i}
            position={[x, 0, z]}
            rotation={[wilt * 0.2, 0, wilt * (i % 2 ? -0.55 : 0.55)]}
            scale={[1, 1 - wilt * 0.2, 1]}
          >
            <mesh position={[0, h / 2, 0]}>
              <cylinderGeometry args={[0.018, 0.024, h, 5]} />
              <meshStandardMaterial color="#66825d" />
            </mesh>
            {Array.from({ length: 5 }, (_, j) => (
              <mesh
                key={j}
                position={[
                  Math.sin(j * 1.256) * 0.08,
                  h,
                  Math.cos(j * 1.256) * 0.08,
                ]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[1, 1, 0.55]}
              >
                <sphereGeometry args={[0.07, 7, 5]} />
                <meshStandardMaterial
                  color={new THREE.Color(
                    ["#f2c5a1", "#e8a9ac", "#f7e6ab"][p.hue % 3],
                  ).lerp(new THREE.Color("#b7a68d"), wilt * 0.4)}
                />
              </mesh>
            ))}
            <mesh position={[0, h + 0.015, 0]}>
              <sphereGeometry args={[0.045, 6, 5]} />
              <meshStandardMaterial color="#dbaf50" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
function Butterfly({
  p,
  index,
  reduced,
}: {
  p: Plant;
  index: number;
  reduced: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && !reduced) {
      const t = clock.elapsedTime;
      ref.current.position.set(
        p.x + Math.sin(t * 0.7 + index) * 0.5,
        0.9 + Math.sin(t * 1.7) * 0.15,
        p.z + Math.cos(t * 0.7 + index) * 0.4,
      );
      ref.current.rotation.y = -t * 0.7;
      ref.current.scale.x = 0.6 + Math.abs(Math.sin(t * 9)) * 0.4;
    }
  });
  return (
    <group ref={ref} position={[p.x, 0.9, p.z]}>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.07, 0, 0]}
          rotation={[0.2, 0, s * 0.3]}
          scale={[1, 0.3, 1.5]}
        >
          <sphereGeometry args={[0.085, 6, 4]} />
          <meshStandardMaterial color="#fff0bb" />
        </mesh>
      ))}
    </group>
  );
}
function Rain({
  point,
  reduced,
}: {
  point: [number, number];
  reduced: boolean;
}) {
  const drops = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    if (!drops.current) return;
    for (let i = 0; i < 65; i++) {
      const a = i * 2.399,
        r = Math.sqrt((i + 0.5) / 65) * 1.15;
      dummy.position.set(
        Math.cos(a) * r,
        reduced ? 1.1 : 2.3 - ((clock.elapsedTime * 2.8 + i * 0.117) % 2.1),
        Math.sin(a) * r,
      );
      dummy.updateMatrix();
      drops.current.setMatrixAt(i, dummy.matrix);
    }
    drops.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={[point[0], 0.4, point[1]]}>
      {[-0.5, 0, 0.5].map((x, i) => (
        <mesh
          position={[x, 2.5, i === 1 ? 0 : 0.06]}
          key={i}
          scale={[0.7, 0.36, 0.5]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#d6e4ee" />
        </mesh>
      ))}
      <instancedMesh ref={drops} args={[undefined, undefined, 65]}>
        <cylinderGeometry args={[0.012, 0.012, 0.15, 4]} />
        <meshBasicMaterial color="#a9d9f4" transparent opacity={0.75} />
      </instancedMesh>
    </group>
  );
}
function Content(props: Props) {
  const {
    world,
    tool,
    cursor,
    setCursor,
    act,
    rain,
    view,
    onAnimal,
    onHarvest,
    rainbow,
  } = props;
  const { camera, size } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.radToDeg(
        2 *
          Math.atan(
            Math.tan(THREE.MathUtils.degToRad(45 / 2)) /
              Math.min(size.width / size.height, 1),
          ),
      );
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);
  const orbit = useRef<OrbitImpl>(null);
  const lastView = useRef(view);
  const down = useRef<{ x: number; y: number; id: number } | null>(null);
  const pointers = useRef(new Set<number>());
  useEffect(() => {
    const start = (e: PointerEvent) => {
      pointers.current.add(e.pointerId);
      if (pointers.current.size > 1) down.current = null;
    };
    const move = (e: PointerEvent) => {
      const start = down.current;
      if (
        start?.id === e.pointerId &&
        Math.hypot(e.clientX - start.x, e.clientY - start.y) >= 8
      )
        down.current = null;
    };
    const end = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
    };
    const clear = () => {
      pointers.current.clear();
      down.current = null;
    };
    window.addEventListener("pointerdown", start, true);
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", clear);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("pointerdown", start, true);
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", clear);
      window.removeEventListener("blur", clear);
    };
  }, []);
  const night = world.time < 6 || world.time > 19;
  const daylight = Math.max(0, Math.sin(((world.time - 6) / 24) * Math.PI * 2));
  const sky = new THREE.Color("#202b4b").lerp(
    new THREE.Color(PALETTES[world.season].sky),
    daylight,
  );
  useFrame(() => {
    if (lastView.current !== view && orbit.current) {
      orbit.current.object.position.set(10, 8.5, 12);
      orbit.current.target.set(0, 0.1, 0);
      orbit.current.update();
      lastView.current = view;
    }
  });
  const hit = (e: ThreeEvent<PointerEvent>) =>
    [e.point.x, e.point.z] as [number, number];
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 24, 55]} />
      <ambientLight intensity={0.55 + daylight * 0.6} />
      <hemisphereLight args={["#e5f2ff", "#7f685c", 0.25 + daylight * 0.85]} />
      <directionalLight
        position={[-6, 10, 5]}
        intensity={0.5 + daylight * 2.5}
        color={night ? "#8fabff" : "#fff0cd"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />
      <OrbitControls
        ref={orbit}
        makeDefault
        enablePan={false}
        enableDamping={!world.reduced}
        minDistance={9}
        maxDistance={23}
        minPolarAngle={0.3}
        maxPolarAngle={1.35}
        target={[0, 0.1, 0]}
        enableRotate
      />
      <group>
        <mesh position={[0, -0.65, 0]} rotation={[0, 0.13, 0]} castShadow>
          <cylinderGeometry args={[6.02, 4.9, 1.7, 11, 2]} />
          <meshStandardMaterial color="#aa8c73" flatShading />
        </mesh>
        <mesh position={[0, -2.4, 0]} rotation={[0, 0.13, 0]}>
          <cylinderGeometry args={[4.9, 1.5, 1.8, 11]} />
          <meshStandardMaterial color="#887967" flatShading />
        </mesh>
        <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[6, 6.07, 0.45, 64]} />
          <meshStandardMaterial
            color={PALETTES[world.season].grass}
            roughness={1}
          />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.262, 0]}
          onPointerDown={(e) => {
            pointers.current.add(e.pointerId);
            down.current =
              pointers.current.size === 1
                ? { x: e.clientX, y: e.clientY, id: e.pointerId }
                : null;
          }}
          onPointerMove={(e) => {
            if (tool !== "explore") setCursor(hit(e));
          }}
          onPointerUp={(e) => {
            pointers.current.delete(e.pointerId);
            if (
              down.current &&
              down.current.id === e.pointerId &&
              Math.hypot(
                e.clientX - down.current.x,
                e.clientY - down.current.y,
              ) < 8 &&
              e.button === 0
            ) {
              const [x, z] = hit(e);
              act(x, z);
            }
            down.current = null;
          }}
          onPointerCancel={() => {
            down.current = null;
            pointers.current.clear();
          }}
          onPointerLeave={() => {
            setCursor(null);
            down.current = null;
            pointers.current.clear();
          }}
        >
          <circleGeometry args={[6, 64]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh
          position={[1.55, 0.278, 0.65]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1.55, 1.05, 1]}
        >
          <circleGeometry args={[1, 48]} />
          <meshStandardMaterial
            color={night ? "#547e9f" : "#8ac5cc"}
            metalness={0.3}
            roughness={0.21}
          />
        </mesh>
        {[0.4, 0.7, 0.95].map((r, i) => (
          <mesh
            key={r}
            rotation={[-Math.PI / 2, 0, 0.4]}
            position={[1.55, 0.287 + i * 0.001, 0.65]}
            scale={[1.55, 1.05, 1]}
          >
            <ringGeometry args={[r, r + 0.013, 48]} />
            <meshBasicMaterial color="#deefde" transparent opacity={0.33} />
          </mesh>
        ))}
        {Array.from({ length: 15 }, (_, i) => {
          const a = (i / 15) * Math.PI * 2;
          return (
            <Pebble
              tool={tool}
              reduced={world.reduced}
              key={`${world.mode}-${i}`}
              position={[
                1.55 + Math.cos(a) * 1.57,
                0.32,
                0.65 + Math.sin(a) * 1.08,
              ]}
              scale={0.14 + (i % 3) * 0.055}
              color="#a5b5a1"
            />
          );
        })}
        {Array.from({ length: 18 }, (_, i) => {
          const a = i * 2.4;
          return (
            <Pebble
              tool={tool}
              reduced={world.reduced}
              key={`${world.mode}-${i}`}
              position={[Math.sin(a) * 5.78, 0.2, Math.cos(a) * 5.78]}
              scale={0.12 + (i % 4) * 0.08}
              color={i % 2 ? "#a5b08e" : "#839681"}
            />
          );
        })}
        <Animals
          plants={world.plants}
          night={night}
          reduced={world.reduced}
          tool={tool}
          onAnimal={onAnimal}
          time={world.time}
          seeds={world.animalSeeds}
          key={world.mode}
        />
        {world.mode !== "free" && <PondFlowers season={world.season} />}
        <Visitors world={world} key={world.mode} />
        <SpringVisitors world={world} />
        <WinterVisitors world={world} />
        <AutumnVisitors world={world} />
        <SeasonParticles season={world.season} reduced={world.reduced} />
        <Rainbow show={rainbow && world.season !== 3} reduced={world.reduced} />
        {world.plants.map((p) =>
          p.kind === "tree" ? (
            <Tree
              key={p.id}
              p={p}
              reduced={world.reduced}
              season={world.season}
              tool={tool}
              onHarvest={onHarvest}
            />
          ) : p.kind === "lotus" ? (
            <PlantedLotus key={p.id} p={p} />
          ) : p.kind === "lilies" ? (
            <Lilies key={p.id} p={p} />
          ) : (
            <Flowers key={p.id} p={p} />
          ),
        )}
        {world.mode !== "free" &&
          Array.from({ length: 7 }, (_, i) => (
            <group
              key={i}
              position={[-2 + i * 0.55, 0.27, -0.7 + Math.sin(i * 2) * 0.3]}
            >
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.035, 0.045, 0.24, 6]} />
                <meshStandardMaterial color="#e9d6b8" />
              </mesh>
              <mesh position={[0, 0.25, 0]} scale={[1, 0.5, 1]}>
                <sphereGeometry
                  args={[0.14, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial
                  color="#e7b49c"
                  emissive="#f4b979"
                  emissiveIntensity={night ? 2 : 0}
                />
              </mesh>
            </group>
          ))}
        {!night &&
          world.plants
            .filter((p) => p.kind === "flowers" && p.growth > 0.85)
            .slice(0, 6)
            .map((p, i) => (
              <Butterfly key={p.id} p={p} index={i} reduced={world.reduced} />
            ))}
        {cursor && tool !== "explore" && (
          <mesh
            position={[cursor[0], 0.3, cursor[1]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry
              args={
                tool === "rain"
                  ? [RADIUS - 0.035, RADIUS, 64]
                  : [0.32, 0.36, 32]
              }
            />
            <meshBasicMaterial
              color={
                tool === "rain"
                  ? "#f6fdff"
                  : (
                        tool === "animal"
                          ? inviteAnimal(world, props.animalSpecies, ...cursor)
                              .world !== world
                          : canPlant(world.plants, ...cursor, props.species)
                      )
                    ? "#f6ffcb"
                    : "#e5a099"
              }
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>
        )}
        {rain && <Rain point={rain} reduced={world.reduced} />}
      </group>
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.18}
        scale={22}
        blur={3}
        far={7}
        resolution={256}
        color="#455261"
      />
      {night && (
        <Stars
          radius={45}
          depth={10}
          count={350}
          factor={2}
          fade
          speed={world.reduced ? 0 : 0.2}
        />
      )}
      <Sparkles
        count={22}
        scale={[15, 6, 12]}
        position={[0, 1, 0]}
        size={2}
        speed={world.reduced ? 0 : 0.12}
        opacity={0.3}
        color="#ffffff"
      />
      {[-1, 1].map((s, i) => (
        <group key={s} position={[s * 8, -1 - i * 1.8, -5]}>
          {[0, 1, 2].map((j) => (
            <mesh
              key={j}
              position={[j * 0.7, j === 1 ? 0.2 : 0, 0]}
              scale={[1.1, 0.38, 0.65]}
            >
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#f3f2ed" transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
export default function Scene(props: Props) {
  const supported = useMemo(() => {
    try {
      const probe = document.createElement("canvas");
      const context = probe.getContext("webgl2");
      if (!context) return false;
      context.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    } catch {
      return false;
    }
  }, []);
  if (!supported)
    return (
      <div className="fallback">
        <h2>This world couldn’t start</h2>
        <p>
          Enable WebGL / hardware acceleration in your browser, then reload.
        </p>
      </div>
    );
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: [10, 8.5, 12], fov: 39 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => props.canvasRef(gl.domElement)}
      fallback={
        <div className="fallback">
          Your browser needs WebGL to bring this world to life. Try a browser
          with hardware acceleration enabled.
        </div>
      }
    >
      <Content {...props} />
    </Canvas>
  );
}
