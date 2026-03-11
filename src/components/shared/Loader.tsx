import { useTranslation } from "react-i18next";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";

export default function Loader({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "w-full h-[calc(100vh-80px)] flex justify-center items-center flex-col overflow-hidden",
        className
      )}
    >
      <DotLottieReact
        src="/tennis-ball.json"
        loop
        autoplay
        mode="bounce"
        className="w-full h-full"
      />
      <p className="font-secondary text-2xl text-brand-black/60 -mt-28">
        {t("loading", { defaultValue: t("common.loading") })}
      </p>
    </section>
  );
}
