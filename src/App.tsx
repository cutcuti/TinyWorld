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
} from "lucide-react";
import Scene from "./Scene";
import { KEY, loadWorld } from "./persistence";
import {
  advance,
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
  const [tool, setTool] = useState<Tool>("explore");
  const [species, setSpecies] = useState<Plant["kind"]>("tree");
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
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const current = useRef(world);
  current.current = world;
  const rainEnd = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const night = world.time < 6 || world.time > 19;
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      setWorld((w) => advance(w, dt));
      if (now > rainEnd.current) setRain(null);
    }, 100);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify(current.current));
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
  function act(x: number, z: number) {
    if (tool === "plant") {
      const w = current.current;
      if (!canPlant(w.plants, x, z)) {
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
        hue: Math.floor(Math.random() * 3),
      };
      setWorld((previous) =>
        canPlant(previous.plants, x, z)
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
      setWorld((w) => waterAt(w, x, z));
      setRain([x, z]);
      rainEnd.current = performance.now() + 2600;
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
    <main className={night ? "night" : ""}>
      <div className="scene" aria-label="Interactive floating island">
        <SceneBoundary>
          <Scene
            world={world}
            tool={tool}
            species={species}
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
        <span className="label-line" /> {world.plants.length} PLANTS · 10
        ANIMALS
      </div>
      {hint && (
        <div className="hint">
          <Move size={16} />
          <span>Drag to wander. Scroll or pinch to get closer.</span>
          <button aria-label="Dismiss hint" onClick={() => setHint(false)}>
            <X size={15} />
          </button>
        </div>
      )}
      <div className="bottom-ui">
        <div className="tool-area">
          <div className="mode-help">
            {tool === "explore"
              ? "A world with nowhere to rush."
              : tool === "plant"
                ? "Tap an open patch of grass to plant."
                : "Tap the garden to make a little rain."}
          </div>
          {tool === "plant" && (
            <div className="species">
              <button
                aria-pressed={species === "tree"}
                onClick={() => setSpecies("tree")}
              >
                <TreePine size={15} /> Trees
              </button>
              <button
                aria-pressed={species === "flowers"}
                onClick={() => setSpecies("flowers")}
              >
                <Flower2 size={15} /> Flowers
              </button>
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
                  setCursor(null);
                }}
              >
                <Icon size={21} />
                <span>{label}</span>
              </button>
            ))}
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
      <footer>
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
          <button onClick={() => setReset(true)}>Start fresh</button>
        </div>
      </footer>
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
          This replaces your planted garden with the original island. Your
          current plants will be removed.
        </p>
        <div>
          <button onClick={() => setReset(false)}>Keep my garden</button>
          <button
            className="confirm"
            onClick={() => {
              const fresh = initialWorld();
              setWorld(fresh);
              current.current = fresh;
              setRain(null);
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
