import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * DotLottie + WASM stay in a separate async chunk so /tournaments cold load
 * does not pay ~300KB+ JS on the critical path. Prefetch as soon as Loader
 * mounts; Suspense shows an empty reserved frame (not a PNG/CSS spinner).
 */
const TennisBallAnimation = lazy(() => import("./TennisBallAnimation"));

export default function Loader({ className }: { className?: string }) {
  const { t } = useTranslation();

  useEffect(() => {
    void import("./TennisBallAnimation");
  }, []);

  return (
    <section
      className={cn(
        "flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center overflow-hidden",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-full w-full">
        <Suspense fallback={null}>
          <TennisBallAnimation />
        </Suspense>
      </div>
      <p className="font-secondary -mt-28 text-2xl text-brand-black/60">
        {t("common.loading")}
      </p>
    </section>
  );
}
