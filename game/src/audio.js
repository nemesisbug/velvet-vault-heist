// Velvet Vault Heist — tiny WebAudio synth: no audio files, no network.
// Every sound is a few oscillators, started on the first user gesture.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function tone(freq, dur, type, gain, when) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playPickup() {
  tone(660, 0.12, "sine", 0.14, 0);
  tone(990, 0.18, "sine", 0.14, 0.08);
}

export function playSapphire() {
  tone(523, 0.15, "triangle", 0.16, 0);
  tone(659, 0.15, "triangle", 0.16, 0.1);
  tone(784, 0.3, "triangle", 0.18, 0.2);
  tone(1046, 0.4, "sine", 0.12, 0.3);
}

export function playSmoke() {
  tone(220, 0.4, "sawtooth", 0.05, 0);
  tone(180, 0.5, "sawtooth", 0.04, 0.05);
}

export function playAlarmTick() {
  tone(880, 0.1, "square", 0.06, 0);
}

export function playCaught() {
  tone(392, 0.25, "sawtooth", 0.14, 0);
  tone(311, 0.25, "sawtooth", 0.14, 0.2);
  tone(233, 0.5, "sawtooth", 0.16, 0.4);
}

export function playWin() {
  tone(523, 0.18, "triangle", 0.15, 0);
  tone(659, 0.18, "triangle", 0.15, 0.15);
  tone(784, 0.18, "triangle", 0.15, 0.3);
  tone(1046, 0.5, "triangle", 0.18, 0.45);
}

export function toggleMute() {
  muted = !muted;
  return muted;
}
