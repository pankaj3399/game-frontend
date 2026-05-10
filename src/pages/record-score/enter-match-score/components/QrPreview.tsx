type QrPreviewProps = {
  dataUrl: string | null;
  onOpenLarge: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  emptyText?: string;
};

export function QrPreview({ dataUrl, onOpenLarge, t, emptyText }: QrPreviewProps) {
  if (dataUrl) {
    return (
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
    );
  }

  return (
    <div className="w-full max-w-[280px] rounded-[10px] border border-[#010a04]/12 bg-white p-2 shadow-[inset_0_0_0_1px_rgba(1,10,4,0.04)] sm:w-auto sm:max-w-none sm:rounded-[4px] sm:p-[6px]">
      <div
        className="relative flex min-h-[136px] w-full items-center justify-center overflow-hidden rounded-[8px] border border-[#010a04]/10 bg-[#ecefee] sm:h-[118px] sm:min-h-0 sm:w-[118px] sm:rounded-[2px]"
        aria-label={t("recordScorePage.enter.qrPreviewEmpty")}
      >
        <div
          className="absolute inset-0 opacity-65"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(1,10,4,0.28) 1px, transparent 0)",
            backgroundSize: "6px 6px",
          }}
        />
        <p className="relative px-2 text-center text-[11px] font-semibold leading-tight text-[#010a04]/80">
          {emptyText ?? t("recordScorePage.enter.qrPreviewEmptyFallback")}
        </p>
      </div>
    </div>
  );
}
