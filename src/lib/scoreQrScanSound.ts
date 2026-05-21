/** Public asset: `game-frontend/public/soundreality-tennis-ball-hit-151257.mp3` */
const SCORE_QR_SCAN_SOUND_SRC = `${import.meta.env.BASE_URL}soundreality-tennis-ball-hit-151257.mp3`;
const SCORE_QR_SCAN_SOUND_PRELOAD_ID = "score-qr-scan-sound-preload";

let sharedAudio: HTMLAudioElement | null = null;
let sharedAudioContext: AudioContext | null = null;
let sharedAudioBuffer: AudioBuffer | null = null;
let audioBufferPromise: Promise<AudioBuffer | null> | null = null;
let audioUnlocked = false;

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function configureAudioElement(audio: HTMLAudioElement) {
  audio.preload = "auto";
  audio.volume = 0.85;
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
}

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio(SCORE_QR_SCAN_SOUND_SRC);
    configureAudioElement(sharedAudio);
  }
  return sharedAudio;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const AudioContextCtor =
    window.AudioContext ??
    (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new AudioContextCtor();
    } catch {
      return null;
    }
  }

  return sharedAudioContext;
}

function resumeAudioContext(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {
      // The synthetic fallback will still try again from the next user gesture.
    });
  }
}

function addAudioPreloadLink() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCORE_QR_SCAN_SOUND_PRELOAD_ID)) return;

  const link = document.createElement("link");
  link.id = SCORE_QR_SCAN_SOUND_PRELOAD_ID;
  link.rel = "preload";
  link.as = "audio";
  link.href = SCORE_QR_SCAN_SOUND_SRC;
  link.type = "audio/mpeg";
  document.head.appendChild(link);
}

async function loadAudioBuffer() {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const response = await fetch(SCORE_QR_SCAN_SOUND_SRC, {
    cache: "force-cache",
  });
  if (!response.ok) return null;

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  sharedAudioBuffer = audioBuffer;
  return audioBuffer;
}

function ensureAudioBufferLoading() {
  if (audioBufferPromise) return audioBufferPromise;

  audioBufferPromise = loadAudioBuffer().catch(() => null);
  return audioBufferPromise;
}

function playDecodedBuffer(audioBuffer: AudioBuffer) {
  const ctx = getAudioContext();
  if (!ctx) return false;

  resumeAudioContext(ctx);

  try {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = audioBuffer;
    gain.gain.value = 0.85;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
    return true;
  } catch {
    return false;
  }
}

function playSyntheticHit() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    resumeAudioContext(ctx);

    const duration = 0.075;
    const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      const decay = 1 - i / frameCount;
      data[i] = (Math.random() * 2 - 1) * decay * decay;
    }

    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    noise.buffer = noiseBuffer;
    filter.type = "bandpass";
    filter.frequency.value = 950;
    filter.Q.value = 0.9;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
    return true;
  } catch {
    // Ignore if Web Audio is unavailable.
    return false;
  }
}

function playClipNow(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

/** Warm and decode the clip so scans do not wait on network/decode in production. */
export function preloadScoreQrScanSound() {
  if (typeof window === "undefined") return;
  addAudioPreloadLink();
  const audio = getSharedAudio();
  audio.load();
  void ensureAudioBufferLoading();
}

/**
 * Call once from a user gesture (tap back, touch scanner area) so iOS/Safari allow playback.
 */
export function unlockScoreQrScanSound() {
  if (typeof window === "undefined") return;
  if (audioUnlocked) return;

  preloadScoreQrScanSound();

  const ctx = getAudioContext();
  if (!ctx) return;

  resumeAudioContext(ctx);
  try {
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start(0);
    audioUnlocked = true;
  } catch {
    audioUnlocked = false;
  }
}

/** Play scan feedback immediately; never wait for the deployed MP3 fetch/decode path. */
export function playScoreQrScanSound() {
  if (typeof window === "undefined") return;

  preloadScoreQrScanSound();

  if (sharedAudioBuffer && playDecodedBuffer(sharedAudioBuffer)) {
    return;
  }

  if (playSyntheticHit()) {
    return;
  }

  const audio = getSharedAudio();
  playClipNow(audio);
}
