import { useTranslation } from "react-i18next";
import { PenLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RenderLogo } from "@/components/shared/RenderLogo";
import { getSafeLink } from "@/lib/url";
import type { PlatformSponsor } from "@/pages/admin/hooks";

export type SponsorItemProps = {
  sponsor: PlatformSponsor;
  onEdit: () => void;
  onRemove: () => void;
  isDeleting: boolean;
  variant: "desktop" | "mobile";
};

export function SponsorItem({ sponsor, onEdit, onRemove, isDeleting, variant }: SponsorItemProps) {
  const { t } = useTranslation();
  const safeLink = getSafeLink(sponsor.link);

  const linkContent = safeLink ? (
    <a
      href={safeLink}
      target="_blank"
      rel="noreferrer noopener"
      className={
        variant === "desktop"
          ? "truncate pr-3 text-sm font-medium text-[#3083ea] underline"
          : "block truncate text-sm text-[#3083ea] underline"
      }
    >
      {safeLink}
    </a>
  ) : variant === "desktop" ? (
    <span className="text-[#010a04]/50">—</span>
  ) : (
    <span className="text-sm text-[#010a04]/50">—</span>
  );

  if (variant === "desktop") {
    return (
      <div className="grid h-[45px] grid-cols-[100px_minmax(180px,1fr)_minmax(220px,1fr)_170px] items-center border-b border-black/10 px-5 text-sm text-[#010a04]">
        <div className="flex items-center">{RenderLogo(sponsor.logoUrl, "size-6")}</div>

        <span className="truncate pr-3">{sponsor.name}</span>

        {linkContent}

        <div className="flex items-center gap-5 text-[12px]">
          <Button
            variant="ghost"
            size="xs"
            className="h-auto rounded-none p-0 text-brand-primary hover:bg-transparent hover:text-brand-primary-hover"
            onClick={onEdit}
            disabled={isDeleting}
          >
            <PenLine className="size-4" />
            {t("admin.platformSponsors.edit")}
          </Button>

          <Button
            variant="ghost"
            size="xs"
            className="h-auto rounded-none p-0 text-[#d92100] hover:bg-transparent hover:text-[#b71e00]"
            onClick={onRemove}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            {t("admin.platformSponsors.remove")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-black/[0.04] px-4 py-4">
      <div className="flex items-center gap-3">
        {RenderLogo(sponsor.logoUrl, "size-6")}

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-[#010a04]">{sponsor.name}</p>
          {linkContent}
        </div>
      </div>

      <div className="mt-4 border-t border-black/10 pt-4">
        <div className="flex items-center justify-between text-xs">
          <Button
            className="inline-flex items-center gap-[5px] text-[#d92100]"
            onClick={onRemove}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            {t("admin.platformSponsors.remove")}
          </Button>

          <Button
            disabled={isDeleting}
            className="inline-flex items-center gap-[5px] text-brand-primary"
            onClick={onEdit}
          >
            <PenLine className="size-4" />
            {t("admin.platformSponsors.edit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
