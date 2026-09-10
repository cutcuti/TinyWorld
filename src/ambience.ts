// Opt-in background audio, independent of the animal-call volume control.
let context: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let generation = 0;
let daylight = true;
let birds: AudioBuffer | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const sources = new Set<AudioBufferSourceNode>();
let recordings: Promise<AudioBuffer[]> | undefined;

function stop() {
  clearTimeout(timer);
  for (const source of sources) source.stop();
  sources.clear();
}
function play(buffer: AudioBuffer, volume: number, loop = false) {
  if (!context || !master) return;
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.loop = loop;
  gain.gain.value = volume;
  source.connect(gain).connect(master);
  sources.add(source);
  source.onended = () => {
    sources.delete(source);
    source.disconnect();
    gain.disconnect();
  };
  source.start();
}
function scheduleBird(delay = 4000) {
  timer = setTimeout(() => {
    if (!enabled) return;
    if (daylight && !document.hidden && context?.state === 'running' && birds)
      play(birds, 0.12);
    scheduleBird(14000 + Math.random() * 14000);
  }, delay);
}
export function setAmbienceTime(hour: number) {
  daylight = hour >= 6 && hour < 19;
}
export async function enableAmbience(value: boolean) {
  const request = ++generation;
  enabled = value;
  if (!value) {
    clearTimeout(timer);
    if (context && master) {
      const now = context.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0, now, 0.05);
      setTimeout(() => {
        if (request !== generation) return;
        stop();
        void context?.suspend();
      }, 250);
    }
    return true;
  }
  try {
    context ??= new AudioContext();
    master ??= context.createGain();
    master.disconnect();
    master.connect(context.destination);
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(0, context.currentTime);
    // Resume directly inside the user's gesture, before fetching recordings.
    await context.resume();
    recordings ??= Promise.all(['stream', 'bird'].map(async (name) => {
      const response = await fetch(`/audio/ambient-${name}.wav`);
      if (!response.ok) throw Error('Soundscape unavailable');
      return context!.decodeAudioData(await response.arrayBuffer());
    })).catch((error) => { recordings = undefined; throw error; });
    const [water, bird] = await recordings;
    if (!enabled || request !== generation) return false;
    stop();
    birds = bird;
    play(water, 0.22, true);
    // A soft, slowly breathing breeze, with a continuous loop seam.
    const wind = context.createBuffer(1, context.sampleRate * 8, context.sampleRate);
    const data = wind.getChannelData(0);
    let smooth = 0;
    for (let i = 0; i < data.length; i++) {
      smooth = smooth * 0.97 + (Math.random() * 2 - 1) * 0.03;
      const phase = i / data.length;
      data[i] = smooth * Math.sin(Math.PI * phase) ** 2;
    }
    play(wind, 0.3, true);
    master.gain.linearRampToValueAtTime(1, context.currentTime + 1.2);
    scheduleBird();
    if (document.hidden) await context.suspend();
    return true;
  } catch {
    if (request === generation) {
      enabled = false;
      stop();
      void context?.suspend();
    }
    return false;
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!context || !enabled) return;
    if (document.hidden) void context.suspend();
    else void context.resume().catch(() => { /* Next toggle can retry. */ });
  });
}
