export const RenderLogo = (logoUrl: string | null | undefined, sizeClassName: string) => (
    <div className={`flex ${sizeClassName} items-center justify-center overflow-hidden rounded-full bg-[#d9d9d9]`}>
      {logoUrl ? <img src={logoUrl} alt="" className="size-full object-cover" /> : null}
    </div>
  );