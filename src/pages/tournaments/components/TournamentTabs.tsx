import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { TournamentListTab } from "@/models/tournament";
import type { TournamentListItem } from "@/models/tournament";
import { formatDateDisplay } from "@/utils/display";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";

interface TournamentTabsProps {
  visible: boolean;
  activeTab: TournamentListTab;
  onTabChange: (tab: TournamentListTab) => void;
  onCreateDraft: () => void;
  draftsPreview: TournamentListItem[];
  draftTotal: number;
  language: string;
}

export function TournamentTabs({
  visible,
  activeTab,
  onTabChange,
  onCreateDraft,
  draftsPreview,
  draftTotal,
  language,
}: TournamentTabsProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  if (activeTab === "drafts") {
    return (
      <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/[0.05] px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-foreground">{t("tournaments.draftsWorkspaceTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("tournaments.draftsWorkspaceInDraftMode")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTabChange("published")}
            className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
          >
            {t("tournaments.showPublished")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/[0.09] to-brand-primary/[0.03] p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{t("tournaments.draftsWorkspaceTitle")}</p>
            <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[11px] font-medium text-brand-primary">
              {t("tournaments.draftsCountLabel", { count: draftTotal })}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("tournaments.draftsWorkspaceDescription")}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateDraft}
            className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
          >
            {t("tournaments.create")}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => onTabChange("drafts")}
            className="bg-brand-primary text-white hover:bg-brand-primary-hover"
          >
            {t("tournaments.openDraftsWorkspace")}
          </Button>
        </div>
      </div>

      {draftsPreview.length > 0 ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {draftsPreview.map((draft) => (
            <Link
              key={draft.id}
              to={`/tournaments/${draft.id}`}
              className="rounded-lg border border-black/10 bg-white/90 px-3 py-2 transition-colors hover:border-brand-primary/30 hover:bg-white"
            >
              <p className="truncate text-sm font-medium text-foreground">{draft.name}</p>
              <p className="truncate text-xs text-muted-foreground">{draft.club?.name ?? t("tournaments.unknownClub")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateDisplay(draft.date, t("tournaments.unscheduled"), getDateFnsLocale(language))}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-black/15 bg-white/70 px-3 py-2 text-xs text-muted-foreground">
          {t("tournaments.noDraftsWorkspaceHint")}
        </div>
      )}
    </div>
  );
}
