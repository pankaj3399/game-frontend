type QrPreviewProps = {
  dataUrl: string | null;
  onOpenLarge: () => void;
  t: (key: string) => string;
  emptyText?: string;
};

export function QrPreview({ dataUrl, onOpenLarge, t, emptyText }: QrPreviewProps) {
  if (dataUrl) {
    return (
      <button
        type="button"
        onClick={onOpenLarge}
        className="group rounded-[4px] border border-[#010a04]/12 bg-white p-[6px] shadow-[inset_0_0_0_1px_rgba(1,10,4,0.04)] transition hover:border-[#067429]/35"
        title={t("recordScorePage.enter.qrPreviewTapToEnlarge")}
      >
        <img
          src={dataUrl}
          alt="Generated score validation QR"
          className="h-[118px] w-[118px] object-contain"
        />
        <p className="mt-1 text-center text-[11px] text-[#010a04]/55 group-hover:text-[#067429]">
          {t("recordScorePage.enter.qrPreviewTapToEnlarge")}
        </p>
      </button>
    );
  }

  return (
    <div className="rounded-[4px] border border-[#010a04]/12 bg-white p-[6px] shadow-[inset_0_0_0_1px_rgba(1,10,4,0.04)]">
      <div
        className="relative flex h-[118px] w-[118px] items-center justify-center overflow-hidden rounded-[2px] border border-[#010a04]/10 bg-[#ecefee]"
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
          {emptyText ?? "No QR generated"}
        </p>
      </div>
    </div>
  );
}
