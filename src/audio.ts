import type { Species } from "./wildlife";
// Small synthesized animal calls; no downloads, samples or autoplay.
let context: AudioContext | null = null;
let enabled = false;
let lastCall = -Infinity;
export async function enableAudio(value: boolean) {
  enabled = value;
  if (!value) {
    await context?.suspend();
    return true;
  }
  try {
    context ??= new AudioContext();
    await context.resume();
    return context.state === "running";
  } catch {
    enabled = false;
    return false;
  }
}
export function animalSound(species: Species, ambient = false) {
  if (!enabled || !context || context.state !== "running" || document.hidden)
    return;
  const now = context.currentTime;
  if (now - lastCall < (ambient ? 2 : 0.18)) return;
  lastCall = now;
  const spec: Record<Species, [number, number, number, OscillatorType]> = {
    cow: [120, 75, 0.85, "sawtooth"],
    chicken: [700, 330, 0.1, "triangle"],
    goat: [310, 200, 0.45, "sawtooth"],
    sheep: [250, 155, 0.6, "sawtooth"],
    horse: [650, 210, 0.9, "sawtooth"],
    dog: [190, 85, 0.18, "sawtooth"],
    duck: [420, 210, 0.16, "sawtooth"],
  };
  const [from, to, duration, type] = spec[species],
    repeat =
      species === "chicken"
        ? 3
        : species === "dog" || species === "duck"
          ? 2
          : 1;
  for (let i = 0; i < repeat; i++) {
    const start = now + i * (duration + 0.08);
    const osc = context.createOscillator(),
      gain = context.createGain(),
      filter = context.createBiquadFilter(),
      vibrato = context.createOscillator(),
      depth = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    filter.type = "lowpass";
    filter.frequency.value = species === "chicken" ? 1600 : 850;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      ambient ? 0.025 : 0.065,
      start + 0.025,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    vibrato.frequency.value = species === "horse" ? 17 : 9;
    depth.gain.value = from * 0.065;
    vibrato.connect(depth).connect(osc.frequency);
    osc.connect(filter).connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
    vibrato.start(start);
    vibrato.stop(start + duration + 0.03);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
      vibrato.disconnect();
      depth.disconnect();
    };
  }
}
