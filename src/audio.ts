import type { Species } from "./wildlife";
// Short CC0 recordings; source credits travel with the bundled audio assets.
let context: AudioContext | null = null;
let enabled = false;
let generation = 0;
let lastCall = -Infinity;
const buffers = new Map<Species, Promise<AudioBuffer>>();
const active = new Set<AudioBufferSourceNode>();
const pitch: Record<Species, number> = {
  cow: 1.12,
  chicken: 1.06,
  goat: 1.08,
  sheep: 1.12,
  horse: 1.08,
  dog: 1.16,
  duck: 1.08,
};
function load(species: Species) {
  if (!buffers.has(species)) {
    const promise = fetch(`/audio/${species}.wav`)
      .then((response) => {
        if (!response.ok) throw Error("Animal recording unavailable");
        return response.arrayBuffer();
      })
      .then((bytes) => context!.decodeAudioData(bytes))
      .catch((error) => {
        buffers.delete(species);
        throw error;
      });
    buffers.set(species, promise);
  }
  return buffers.get(species)!;
}
function stopCalls() {
  for (const source of active) source.stop();
  active.clear();
}
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      generation++;
      stopCalls();
    }
  });
}
export async function enableAudio(value: boolean) {
  const request = ++generation;
  enabled = value;
  if (!value) {
    stopCalls();
    await context?.suspend();
    return true;
  }
  try {
    context ??= new AudioContext();
    await context.resume();
    await Promise.all((Object.keys(pitch) as Species[]).map(load));
    return enabled && request === generation && context.state === "running";
  } catch {
    if (request === generation) {
      enabled = false;
      stopCalls();
    }
    return false;
  }
}
export async function animalSound(species: Species, ambient = false) {
  if (!enabled || !context || context.state !== "running" || document.hidden)
    return;
  const request = generation;
  let buffer: AudioBuffer;
  try {
    buffer = await load(species);
  } catch {
    return;
  }
  if (
    !enabled ||
    request !== generation ||
    document.hidden ||
    context.state !== "running"
  )
    return;
  const now = context.currentTime;
  if (now - lastCall < (ambient ? 2 : 0.18) || (ambient && active.size > 0))
    return;
  lastCall = now;
  // Keep rapid tapping gentle, and never stack a chorus of loud calls.
  if (active.size >= 3) return;
  const source = context.createBufferSource(),
    gain = context.createGain();
  source.buffer = buffer;
  source.playbackRate.value =
    pitch[species] * (1 + (Math.random() - 0.5) * 0.04);
  const duration = buffer.duration / source.playbackRate.value;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(ambient ? 0.14 : 0.36, now + 0.02);
  gain.gain.setValueAtTime(
    ambient ? 0.14 : 0.36,
    now + Math.max(0.02, duration - 0.06),
  );
  gain.gain.linearRampToValueAtTime(0, now + duration);
  source.connect(gain).connect(context.destination);
  active.add(source);
  source.onended = () => {
    active.delete(source);
    source.disconnect();
    gain.disconnect();
  };
  source.start(now);
}
