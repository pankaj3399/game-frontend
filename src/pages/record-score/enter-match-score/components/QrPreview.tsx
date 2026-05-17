import { IconExternalLink } from "@/icons/figma-icons";

type QrPreviewProps = {
  dataUrl: string | null;
  isGenerating?: boolean;
  onOpenLarge: () => void;
  onCopyLink?: () => void;
  hasValidationLink?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

export function QrPreview({
  dataUrl,
  isGenerating = false,
  onOpenLarge,
  onCopyLink,
  hasValidationLink,
  t,
}: QrPreviewProps) {
  if (isGenerating && !dataUrl) {
    return (
      <div className="flex flex-col items-center gap-2">
        {/* Fixed-size placeholder matching the real QR button so layout doesn't shift */}
        <div className="flex flex-col items-center gap-1.5 rounded-[10px] border border-[#010a04]/08 bg-white p-2 sm:rounded-[4px] sm:p-[6px]">
          <div className="relative h-[136px] w-[136px] overflow-hidden rounded-[6px] bg-[#f0f1f0] sm:h-[118px] sm:w-[118px]">
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            {/* QR-like dot pattern hint */}
            <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 opacity-25">
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-[3px] bg-[#010a04]"
                    style={{ opacity: [0, 2, 4, 6].includes(i) ? 1 : 0.35 }}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] leading-snug text-[#010a04]/40 sm:mt-1">
            {t("recordScorePage.enter.qrGenerating", { defaultValue: "Generating…" })}
          </p>
        </div>
      </div>
    );
  }

  if (dataUrl) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onOpenLarge}
          className="group rounded-[10px] border border-[#010a04]/12 bg-white p-2 shadow-[inset_0_0_0_1px_rgba(1,10,4,0.04)] transition hover:border-[#067429]/35 sm:rounded-[4px] sm:p-[6px]"
          title={t("recordScorePage.enter.qrPreviewTapToEnlarge")}
        >
          <img
            src={dataUrl}
            alt={t("recordScorePage.enter.qrPreviewAlt")}
            className="mx-auto h-[136px] w-[136px] object-contain sm:h-[118px] sm:w-[118px]"
          />
          <p className="mt-1.5 text-center text-[11px] leading-snug text-[#010a04]/55 group-hover:text-[#067429] sm:mt-1">
            {t("recordScorePage.enter.qrPreviewTapToEnlarge")}
          </p>
        </button>

        {hasValidationLink && onCopyLink ? (
          <button
            type="button"
            onClick={onCopyLink}
            title={t("recordScorePage.enter.copyValidationLink")}
            className="flex items-center gap-1.5 rounded-full border border-[#010a04]/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[#010a04]/65 shadow-sm transition hover:border-[#1d8ced]/40 hover:text-[#1d8ced]"
          >
            <IconExternalLink size={12} className="shrink-0" />
            {t("recordScorePage.enter.copyLink")}
          </button>
        ) : null}
      </div>
    );
  }

  return null;
}
