/** Public asset: `game-frontend/public/soundreality-tennis-ball-hit-151257.mp3` */
const SCORE_QR_SCAN_SOUND_SRC = `${import.meta.env.BASE_URL}soundreality-tennis-ball-hit-151257.mp3`;

let sharedAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

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

function playFallbackBeep() {
  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
    void ctx.close();
  } catch {
    // Ignore if Web Audio is unavailable.
  }
}

function playClipNow(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
  void audio.play().catch(() => {
    playFallbackBeep();
  });
}

/** Warm the clip so the first scan does not wait on network/decode. */
export function preloadScoreQrScanSound() {
  if (typeof window === "undefined") return;
  const audio = getSharedAudio();
  audio.load();
}

/**
 * Call once from a user gesture (tap back, touch scanner area) so iOS/Safari allow playback.
 */
export function unlockScoreQrScanSound() {
  if (typeof window === "undefined") return;
  if (audioUnlocked) return;

  const audio = getSharedAudio();
  playClipNow(audio);
  audio.addEventListener(
    "playing",
    () => {
      audio.pause();
      audio.currentTime = 0;
      audioUnlocked = true;
    },
    { once: true },
  );
  audio.addEventListener(
    "error",
    () => {
      audioUnlocked = false;
    },
    { once: true },
  );
}

/** Play scan feedback immediately (tennis hit, with short beep fallback). */
export function playScoreQrScanSound() {
  if (typeof window === "undefined") return;

  const audio = getSharedAudio();
  if (audioUnlocked) {
    playClipNow(audio);
    return;
  }

  const clip = audio.cloneNode(true) as HTMLAudioElement;
  configureAudioElement(clip);
  playClipNow(clip);
}
