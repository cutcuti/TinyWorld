import { Color } from "three";
import { PALETTES } from "./GardenDetails";
import { enableAudio, animalSound } from "./audio";
import { enableAmbience, setAmbienceTime } from "./ambience";
import type { Species } from "./wildlife";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import {
  MousePointer2,
  Sprout,
  CloudRain,
  Camera,
  RotateCcw,
  Sun,
  Moon,
  Pause,
  Play,
  X,
  Flower2,
  TreePine,
  Move,
  Check,
  Leaf,
  Volume2,
  VolumeX,
  Wind,
  ShoppingBasket,
  PawPrint,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import Scene from "./Scene";
import { KEY, FREE_KEY, MODE_KEY, loadWorld } from "./persistence";
import {
  advance,
  plantWilt,
  inviteAnimal,
  SEASONS,
  nextSeason,
  collectAnimal,
  harvest,
  canPlant,
  initialWorld,
  LIMIT,
  waterAt,
  type Plant,
  type Tool,
} from "./simulation";
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="fallback">
        <h2>This world couldn’t start</h2>
        <p>
          Enable WebGL / hardware acceleration in your browser, then reload.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const [world, setWorld] = useState(loadWorld);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [tool, setTool] = useState<Tool>("explore");
  const controlsExpanded = controlsOpen;
  const controlsToggle = useRef<HTMLButtonElement>(null);
  function closeControls() {
    setControlsOpen(false);
    setCursor(null);
  }
  const [animalSpecies, setAnimalSpecies] = useState<Species>("chicken");
  const [species, setSpecies] = useState<Plant["kind"]>("tree");
  const activeToolLabel =
    tool === "plant"
      ? `Plant · ${{ tree: "Trees", flowers: "Flowers", lilies: "Lilies", lotus: "Lotus" }[species]}`
      : tool === "animal"
        ? (world.mode === "free" ? `Add · ${animalSpecies}` : "Animals")
        : tool === "treat"
          ? "Share a treat"
        : tool === "rain"
          ? "Rain"
          : "Explore";
  const ActiveToolIcon =
    tool === "plant"
      ? Sprout
      : tool === "animal" || tool === "treat"
        ? PawPrint
        : tool === "rain"
          ? CloudRain
          : MousePointer2;
  const [cursor, setCursor] = useState<[number, number] | null>(null);
  const [rain, setRain] = useState<[number, number] | null>(null);
  const [view, setView] = useState(0);
  const [reset, setReset] = useState(false);
  const [hint, setHint] = useState(() => {
    try {
      return localStorage.getItem("little-living-world-hint-seen") !== "true";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!hint) {
      try {
        localStorage.setItem("little-living-world-hint-seen", "true");
      } catch {
        /* Saving is optional. */
      }
    }
  }, [hint]);
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(true);
  const [sound, setSound] = useState(false);
  const [ambience, setAmbience] = useState(false);
  const [ambienceLoading, setAmbienceLoading] = useState(false);
  useEffect(() => setAmbienceTime(world.time), [world.time]);
  const [rainbow, setRainbow] = useState(false);
  useEffect(
    () => () => {
      void enableAudio(false);
      void enableAmbience(false);
    },
    [],
  );
  async function toggleAmbience() {
    setAmbienceLoading(true);
    const next = !ambience;
    const ok = await enableAmbience(next);
    setAmbience(next && ok);
    setAmbienceLoading(false);
    if (next && !ok) setNotice("The soundscape could not start. Tap to try again.");
  }
  async function toggleSound() {
    const next = !sound;
    const ok = await enableAudio(next);
    setSound(next && ok);
    if (next && !ok)
      setNotice("Sound could not start. Try again in your browser.");
  }
  function onAnimal(id: number, species: Species) {
    animalSound(species);
    const result = collectAnimal(current.current, id, species);
    current.current = result.world;
    setWorld(result.world);
    setNotice(result.message);
  }
  function onHarvest(id: string) {
    const result = harvest(current.current, id);
    current.current = result.world;
    setWorld(result.world);
    setNotice(result.message);
  }

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const current = useRef(world);
  current.current = world;
  const rainEnd = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const night = world.time < 6 || world.time > 19;
  const sky = new Color("#202b4b").lerp(
    new Color(PALETTES[world.season].sky),
    Math.max(0, Math.sin(((world.time - 6) / 24) * Math.PI * 2)),
  );
  const skyLuminance = 0.2126 * sky.r + 0.7152 * sky.g + 0.0722 * sky.b;
  const skyInk =
    skyLuminance > 0.4
      ? "#253e36"
      : skyLuminance > 0.179
        ? "#000000"
        : "#ffffff";
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      setWorld((w) => advance(w, dt));
      if (now > rainEnd.current) setRain(null);
      setRainbow(rainEnd.current > 0 && now > rainEnd.current && now < rainEnd.current + 8000);
    }, 100);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(
          current.current.mode === "free" ? FREE_KEY : KEY,
          JSON.stringify(current.current),
        );
        localStorage.setItem(MODE_KEY, current.current.mode);
        setSaved(true);
      } catch {
        setSaved(false);
      }
    };
    const id = setInterval(save, 1500);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(id);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, []);
  useEffect(() => {
    if (notice) {
      const id = setTimeout(() => setNotice(""), 3300);
      return () => clearTimeout(id);
    }
  }, [notice]);
  useEffect(() => {
    if (reset) dialog.current?.showModal();
    else dialog.current?.close();
  }, [reset]);
  function switchMode() {
    const mode = current.current.mode === "free" ? "garden" : "free";
    try {
      localStorage.setItem(
        current.current.mode === "free" ? FREE_KEY : KEY,
        JSON.stringify(current.current),
      );
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      setSaved(false);
    }
    const next = loadWorld(mode);
    current.current = next;
    setWorld(next);
    setTool(mode === "free" ? "plant" : "explore");
    setRain(null);
    rainEnd.current = 0;
    setRainbow(false);
    setNotice(
      mode === "free"
        ? "Your own blank canvas. Plant something, then invite a neighbor."
        : "Welcome back to your garden.",
    );
  }
  function act(x: number, z: number) {
    if (tool === "animal" && current.current.mode === "free") {
      const result = inviteAnimal(current.current, animalSpecies, x, z);
      current.current = result.world;
      setWorld(result.world);
      setNotice(result.message);
      return;
    }
    if (tool === "plant") {
      const w = current.current;
      if (!canPlant(w.plants, x, z, species)) {
        setNotice(
          w.plants.length >= LIMIT
            ? "Your island is full. Enjoy your little forest."
            : "Find an open patch of grass.",
        );
        return;
      }
      const plant: Plant = {
        id: crypto.randomUUID(),
        x,
        z,
        kind: species,
        growth: 0,
        water: 0,
        moisture: 1,
        hue: Math.floor(Math.random() * 3),
      };
      setWorld((previous) =>
        canPlant(previous.plants, x, z, species)
          ? { ...previous, plants: [...previous.plants, plant] }
          : previous,
      );
      setNotice(
        species === "tree"
          ? "A little tree, a new beginning."
          : "A little color for your world.",
      );
      setHint(false);
    }
    if (tool === "rain") {
      if (
        current.current.plants.some(
          (p) => Math.hypot(p.x - x, p.z - z) < 1.35 && plantWilt(p) > 0.1,
        )
      )
        setNotice("A little water. They'll perk up in a moment.");
      setWorld((w) => waterAt(w, x, z));
      setRain([x, z]);
      rainEnd.current = performance.now() + 2600;
      setRainbow(false);
      setHint(false);
    }
  }
  function screenshot() {
    if (!canvas.current) return;
    canvas.current.toBlob((blob) => {
      if (!blob) {
        setNotice("Could not save the image. Please try again.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "little-living-world.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("A little memory, saved.");
    }, "image/png");
  }
  const hour = Math.floor(world.time);
  const minutes = Math.floor((world.time - hour) * 60);
  const time = `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return (
    <main
      className={night ? "night" : ""}
      data-tool={tool}
      data-controls={controlsExpanded ? "expanded" : "collapsed"}
      data-season={SEASONS[world.season]}
      style={{ "--sky-ink": skyInk } as React.CSSProperties}
    >
      <div className="scene" aria-label="Interactive floating island">
        <SceneBoundary>
          <Scene
            world={world}
            onAnimal={onAnimal}
            onHarvest={onHarvest}
            rainbow={rainbow}
            tool={tool}
            species={species}
            animalSpecies={animalSpecies}
            cursor={cursor}
            setCursor={setCursor}
            act={act}
            rain={rain}
            view={view}
            canvasRef={(c) => (canvas.current = c)}
          />
        </SceneBoundary>
      </div>
      <header>
        <a className="brand" href="#" aria-label="Little Living World">
          <span className="brand-mark">
            <Leaf size={21} />
          </span>
          <span>
            little living world
            <span className="eyebrow">A SMALL PLACE TO SLOW DOWN</span>
          </span>
        </a>
        <div className="top-actions">
          <span className="save-state">
            <span className={saved ? "dot" : "dot warning"} />
            {saved ? "Saved on this device" : "Saving unavailable"}
          </span>
          <button
            className="icon-button"
            onClick={screenshot}
            title="Save screenshot"
            aria-label="Save screenshot"
          >
            <Camera size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => setView((v) => v + 1)}
            title="Reset view"
            aria-label="Reset view"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>
      <div className="basket" aria-label="Harvest basket">
        <ShoppingBasket size={17} />
        <span aria-label={`${world.basket.milk} milk`}>
          🥛 {world.basket.milk}
        </span>
        <span aria-label={`${world.basket.eggs} eggs`}>
          🥚 {world.basket.eggs}
        </span>
        <span aria-label={`${world.basket.fruit} fruit`}>
          🍎 {world.basket.fruit}
        </span>
      </div>
      <div className="world-caption">
        <span className="tiny-label">YOUR OWN LITTLE CORNER</span>
        <h1>
          Let life
          <br />
          <em>take its time.</em>
        </h1>
        <p>A little care. A little wonder.</p>
      </div>
      <div className="island-label">
        <span className="dot" /> THE FLOATING GARDEN{" "}
        <span className="label-line" /> {world.plants.length} PLANTS ·{" "}
        {world.animalSeeds?.length ?? 14}
        ANIMALS
      </div>
      {hint && (
        <div className="hint">
          <Move size={16} />
          <span>Drag to explore. Tap animals and fruit trees.</span>
          <button aria-label="Dismiss hint" onClick={() => setHint(false)}>
            <X size={15} />
          </button>
        </div>
      )}
      <div
        className="control-center"
        onKeyDown={(e) => {
          if (e.key === "Escape" && controlsExpanded) {
            closeControls();
            controlsToggle.current?.focus();
          }
        }}
      >
        <button
          ref={controlsToggle}
          className="controls-toggle"
          aria-label={
            controlsExpanded ? "Close garden controls" : "Open garden controls"
          }
          aria-expanded={controlsExpanded}
          aria-controls="garden-controls garden-settings"
          onClick={() =>
            controlsExpanded ? closeControls() : setControlsOpen(true)
          }
        >
          {controlsExpanded ? (
            <ChevronDown size={18} />
          ) : (
            <ActiveToolIcon size={18} />
          )}
          <span>{controlsExpanded ? "Hide controls" : activeToolLabel}</span>
          {!controlsExpanded && (
            <>
              <span className="compact-clock">{time}</span>
              <SlidersHorizontal size={17} />
              <span>Controls</span>
            </>
          )}
        </button>
        <div className="bottom-ui" id="garden-controls">
          <div className="season-controls">
            <button
              className="season-button"
              aria-label={`Next season: ${SEASONS[(world.season + 1) % 4]}`}
              onClick={() => {
                const next = nextSeason(current.current);
                current.current = next;
                setWorld(next);
                setNotice(`Hello, ${SEASONS[next.season].toLowerCase()}.`);
              }}
            >
              <span>
                {["🌷", "☀️", "🍂", "❄️"][world.season]} {SEASONS[world.season]}
              </span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              className="sound-button"
              aria-label={sound ? "Mute animal sounds" : "Enable animal sounds"}
              aria-pressed={sound}
              onClick={toggleSound}
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>{sound ? "Sound on" : "Sound off"}</span>
            </button>
            <button
              className="sound-button ambience-button"
              aria-label={ambience ? "Mute ambient soundscape" : "Enable ambient soundscape"}
              title="Wind, water and birds"
              aria-pressed={ambience}
              disabled={ambienceLoading}
              onClick={toggleAmbience}
            >
              <Wind size={18} />
            </button>
          </div>
          <div className="tool-area">
            <div className="mode-help">
              {tool === "explore"
                ? "Tap animals or fruit trees to say hello and collect."
                : tool === "treat"
                  ? "Tap an awake animal to share a treat. Just because."
                : tool === "animal"
                  ? (world.mode === "free" ? "Invite a neighbor, or share a little treat." : "A little moment together. Treats are always here.")
                  : tool === "plant"
                    ? "Tap grass to plant. Lotuses belong in the pond."
                    : "Tap the garden to make a little rain."}
            </div>
            {tool === "plant" && (
              <div className="species">
                <button
                  aria-pressed={species === "tree"}
                  onClick={() => {
                    setSpecies("tree");
                    closeControls();
                  }}
                >
                  <TreePine size={15} /> Trees
                </button>
                <button
                  aria-pressed={species === "flowers"}
                  onClick={() => {
                    setSpecies("flowers");
                    closeControls();
                  }}
                >
                  <Flower2 size={15} /> Flowers
                </button>
                <button
                  aria-pressed={species === "lilies"}
                  onClick={() => {
                    setSpecies("lilies");
                    closeControls();
                  }}
                >
                  <Flower2 size={15} /> Lilies
                </button>
                <button
                  aria-pressed={species === "lotus"}
                  onClick={() => {
                    setSpecies("lotus");
                    closeControls();
                  }}
                >
                  <Flower2 size={15} /> Lotus
                </button>
              </div>
            )}
            {(tool === "animal" || tool === "treat") && (
              <div className="animal-picker">
                <button aria-pressed={tool === "treat"} onClick={() => { setTool("treat"); setCursor(null); setControlsOpen(false); }}>Share a treat ♡</button>
                {world.mode === "free" && <button aria-pressed={tool === "animal"} onClick={() => setTool("animal")}>Invite a neighbor</button>}
              </div>
            )}
            {world.mode === "free" && tool === "animal" && (
              <div className="animal-picker">
                <label htmlFor="animal-choice">Invite</label>
                <select
                  id="animal-choice"
                  aria-label="Animal to add"
                  value={animalSpecies}
                  onChange={(e) => {
                    setAnimalSpecies(e.target.value as Species);
                    closeControls();
                  }}
                >
                  {[
                    "chicken",
                    "cow",
                    "goat",
                    "sheep",
                    "horse",
                    "dog",
                    "duck",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <nav className="toolbar" aria-label="Garden tools">
              {(
                [
                  { id: "explore", label: "Explore", Icon: MousePointer2 },
                  { id: "plant", label: "Plant", Icon: Sprout },
                  { id: "rain", label: "Rain", Icon: CloudRain },
                ] as const
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  aria-pressed={tool === id}
                  onClick={() => {
                    setTool(id);
                    if (id !== "plant") setControlsOpen(false);
                    setCursor(null);
                  }}
                >
                  <Icon size={21} />
                  <span>{label}</span>
                </button>
              ))}
              {(
                <button
                  aria-pressed={tool === "animal" || tool === "treat"}
                  onClick={() => { setTool("animal"); setControlsOpen(true); }}
                >
                  <PawPrint size={21} />
                  <span>Animals</span>
                </button>
              )}
            </nav>
          </div>
          <section className="time-panel" aria-label="Time of day">
            <div className="time-heading">
              <span>
                {night ? <Moon size={17} /> : <Sun size={17} />}{" "}
                {night
                  ? "Under the stars"
                  : world.time < 12
                    ? "Morning light"
                    : world.time < 17
                      ? "A gentle afternoon"
                      : "Golden hour"}
              </span>
              <span className="clock">{time}</span>
            </div>
            <div className="time-controls">
              <Sun size={14} />
              <input
                aria-label="Time of day"
                type="range"
                min="0"
                max="23.99"
                step=".01"
                value={world.time}
                onChange={(e) =>
                  setWorld((w) => ({ ...w, time: Number(e.target.value) }))
                }
              />
              <Moon size={14} />
              <button
                aria-label={
                  world.paused
                    ? "Resume day-night cycle"
                    : "Pause day-night cycle"
                }
                onClick={() => setWorld((w) => ({ ...w, paused: !w.paused }))}
              >
                {world.paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </div>
          </section>
        </div>
        <footer id="garden-settings">
          <span>GROW SOMETHING GOOD.</span>
          <div>
            <label>
              <input
                type="checkbox"
                checked={world.reduced}
                onChange={(e) =>
                  setWorld((w) => ({ ...w, reduced: e.target.checked }))
                }
              />{" "}
              Less motion
            </label>
            <button onClick={switchMode}>
              {world.mode === "free" ? "Return to garden" : "Free world"}
            </button>
            <button onClick={() => setReset(true)}>Start fresh</button>
          </div>
        </footer>
      </div>
      <div className="toast" role="status" aria-live="polite">
        {notice && (
          <>
            <Check size={16} />
            {notice}
          </>
        )}
      </div>
      <dialog ref={dialog} onCancel={() => setReset(false)}>
        <h2>A fresh little beginning?</h2>
        <p>
          This clears the plants and harvest basket in this mode. Your other
          world stays saved.
        </p>
        <div>
          <button onClick={() => setReset(false)}>Keep my garden</button>
          <button
            className="confirm"
            onClick={() => {
              const fresh = initialWorld(current.current.mode);
              setWorld(fresh);
              current.current = fresh;
              setRain(null);
              rainEnd.current = 0;
              setRainbow(false);
              setReset(false);
              setNotice("A fresh world, full of possibility.");
            }}
          >
            Start fresh
          </button>
        </div>
      </dialog>
    </main>
  );
}
