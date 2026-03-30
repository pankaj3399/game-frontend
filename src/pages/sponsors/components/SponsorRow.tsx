import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PencilEdit01Icon, Delete02Icon } from "@/icons/figma-icons";
import { cn } from "@/lib/utils";
import { getSafeLink } from "@/lib/url";
import type { ClubSponsor } from "@/pages/sponsors/hooks";

interface SponsorRowProps {
  sponsor: ClubSponsor;
  canManage: boolean;
  onEdit: (sponsor: ClubSponsor) => void;
  onRemove: (sponsor: ClubSponsor) => void;
}

export function SponsorRow({ sponsor, canManage, onEdit, onRemove }: SponsorRowProps) {
  const { t } = useTranslation();
  const safeLink = getSafeLink(sponsor.link);

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 align-middle">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {sponsor.logoUrl ? (
            <img
              src={sponsor.logoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {(sponsor.name?.slice(0, 2) ?? "?").toUpperCase()}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <span
          className={cn(
            "font-medium text-foreground",
            sponsor.status === "paused" && "text-muted-foreground"
          )}
        >
          {sponsor.name}
        </span>
        {sponsor.status === "paused" && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            {t("sponsors.paused")}
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        {safeLink ? (
          <a
            href={safeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline truncate max-w-[200px] inline-block"
          >
            {safeLink}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary-hover"
            onClick={() => onEdit(sponsor)}
            disabled={!canManage}
          >
            <PencilEdit01Icon size={16} className="mr-1" />
            {t("sponsors.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(sponsor)}
            disabled={!canManage}
          >
            <Delete02Icon size={16} className="mr-1" />
            {t("sponsors.remove")}
          </Button>
        </div>
      </td>
    </tr>
  );
}
