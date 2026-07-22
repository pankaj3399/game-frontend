import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react";

// Keep WASM + player off the main cold-load chunk — this module is lazy-loaded.
setWasmUrl(`${import.meta.env.BASE_URL}dotlottie-player.wasm`);

/** Full-bleed bounce Lottie from public/tennis-ball.json */
export default function TennisBallAnimation() {
  return (
    <DotLottieReact
      src={`${import.meta.env.BASE_URL}tennis-ball.json`}
      loop
      autoplay
      mode="bounce"
      className="h-full w-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
