import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import InlineLoader from "@/components/shared/InlineLoader";

export default function Loader({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center gap-4 overflow-hidden",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <InlineLoader
        size="lg"
        className="border-brand-primary/20 border-t-brand-primary"
      />
      <p className="font-secondary text-2xl text-brand-black/60">
        {t("common.loading")}
      </p>
    </section>
  );
}
