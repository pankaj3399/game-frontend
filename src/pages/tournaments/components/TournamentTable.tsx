import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PencilIcon, Upload01Icon, ViewIcon } from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  TournamentListItem,
  TournamentPagination,
  TournamentStatus,
} from "@/models/tournament";
import { formatDateDisplay } from "@/utils/display";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";

interface TournamentTableProps {
  tournaments: TournamentListItem[];
  pagination: TournamentPagination;
  language: string;
  getRowPermissions: (status: TournamentStatus) => {
    canEditDraft: boolean;
    canPublishDraft: boolean;
  };
  onEdit: (id: string) => void;
  onPublish: (id: string) => void;
  isPublishing: boolean;
}

export function TournamentTable({
  tournaments,
  pagination,
  language,
  getRowPermissions,
  onEdit,
  onPublish,
  isPublishing,
}: TournamentTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto border-y border-black/10">
      <Table className="min-w-[860px] table-fixed">
        <TableHeader>
          <TableRow className="h-[35px] border-black/10 bg-black/5 hover:bg-black/5">
            <TableHead className="h-[35px] w-12 px-4 py-0 text-left text-xs font-normal text-foreground/80">
              #
            </TableHead>
            <TableHead className="h-[35px] w-[35%] px-3 py-0 text-left text-xs font-normal text-foreground/80">
              {t("tournaments.tournamentName")}
            </TableHead>
            <TableHead className="h-[35px] w-[33%] px-3 py-0 text-left text-xs font-normal text-foreground/80">
              {t("tournaments.club")}
            </TableHead>
            <TableHead className="h-[35px] w-[16%] px-3 py-0 text-left text-xs font-normal text-foreground/80">
              {t("tournaments.date")}
            </TableHead>
            <TableHead className="h-[35px] w-[16%] px-3 py-0 text-left text-xs font-normal text-foreground/80">
              {t("tournaments.action")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament, idx) => {
            const { canEditDraft, canPublishDraft } = getRowPermissions(tournament.status);
            const statusLabel =
              tournament.status === "active"
                ? t("tournaments.statusActive")
                : tournament.status === "draft"
                  ? t("tournaments.statusDraft")
                  : t("tournaments.statusInactive");
            const statusDotClass =
              tournament.status === "active"
                ? "bg-emerald-500"
                : tournament.status === "draft"
                  ? "bg-amber-400"
                  : "bg-muted-foreground/50";

            return (
              <TableRow
                key={tournament.id}
                className="h-[45px] border-black/10 bg-card hover:bg-black/[0.015]"
              >
                <TableCell className="px-4 py-0 text-xs text-foreground/90">
                  {(pagination.page - 1) * pagination.limit + idx + 1}
                </TableCell>
                <TableCell className="px-3 py-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-[22px] w-[22px] shrink-0 rounded-[5px] bg-black/15"
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm text-foreground">{tournament.name}</span>
                    <span
                      role="img"
                      className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass}`}
                      aria-label={statusLabel}
                      title={statusLabel}
                    />
                  </div>
                </TableCell>
                <TableCell className="px-3 py-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full bg-black/15"
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm text-foreground">
                      {tournament.club?.name ?? "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-3 py-0 text-sm text-foreground/90">
                  {formatDateDisplay(
                    tournament.date,
                    t("tournaments.unscheduled"),
                    getDateFnsLocale(language)
                  )}
                </TableCell>
                <TableCell className="px-3 py-0">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-auto px-0 text-sm font-normal text-foreground hover:bg-transparent"
                    >
                      <Link to={`/tournaments/${tournament.id}`}>
                        <ViewIcon size={16} className="mr-1" />
                        {t("tournaments.view")}
                      </Link>
                    </Button>
                    {canEditDraft && (
                      <Button variant="outline" size="sm" onClick={() => onEdit(tournament.id)}>
                        <PencilIcon size={16} className="mr-1" />
                        {t("tournaments.edit")}
                      </Button>
                    )}
                    {canPublishDraft && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-1.5 text-sm font-normal text-foreground hover:bg-transparent"
                        onClick={() => onPublish(tournament.id)}
                        disabled={isPublishing}
                      >
                        <Upload01Icon size={16} className="mr-1" />
                        {t("tournaments.publish")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
