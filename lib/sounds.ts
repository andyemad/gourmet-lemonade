// Simple Web Audio sound effects — no external files needed

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function playBeep(freq = 880, duration = 0.1, type: OscillatorType = "square", volume = 0.08) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playConfirm() {
  playBeep(660, 0.1, "square", 0.07);
  setTimeout(() => playBeep(880, 0.1, "square", 0.07), 100);
  setTimeout(() => playBeep(1100, 0.15, "square", 0.07), 200);
}

export function playSuccess() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playBeep(freq, 0.2, "square", 0.06), i * 120);
  });
}

export function playClick() {
  playBeep(440, 0.05, "square", 0.05);
}

export function playError() {
  playBeep(200, 0.2, "sawtooth", 0.06);
  setTimeout(() => playBeep(150, 0.3, "sawtooth", 0.05), 200);
}
