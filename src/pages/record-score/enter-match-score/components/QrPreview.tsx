type QrPreviewProps = {
  dataUrl: string | null;
  isGenerating?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const QR_FRAME_CLASS =
  "w-full max-w-[min(560px,100%)] rounded-[10px] border border-[#010a04]/12 bg-white p-2 shadow-[inset_0_0_0_1px_rgba(1,10,4,0.04)] sm:rounded-[4px] sm:p-[6px]";

const QR_IMAGE_CLASS = "aspect-square w-full object-contain";

export function QrPreview({ dataUrl, isGenerating = false, t }: QrPreviewProps) {
  if (isGenerating && !dataUrl) {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        <div className={QR_FRAME_CLASS}>
          <div
            className={`relative overflow-hidden rounded-[6px] bg-[#f0f1f0] ${QR_IMAGE_CLASS}`}
            aria-hidden
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 opacity-25">
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-[3px] bg-[#010a04] sm:h-9 sm:w-9"
                    style={{ opacity: [0, 2, 4, 6].includes(i) ? 1 : 0.35 }}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] leading-snug text-[#010a04]/40 sm:mt-1.5 sm:text-[12px]">
            {t("recordScorePage.enter.qrGenerating", { defaultValue: "Generating…" })}
          </p>
        </div>
      </div>
    );
  }

  if (dataUrl) {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        <div className={QR_FRAME_CLASS}>
          <img
            src={dataUrl}
            alt={t("recordScorePage.enter.qrPreviewAlt")}
            className={QR_IMAGE_CLASS}
          />
          <p className="mt-2 text-center text-[11px] leading-snug text-[#010a04]/55 sm:mt-1.5 sm:text-[12px]">
            {t("recordScorePage.enter.qrPreviewHelp")}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
