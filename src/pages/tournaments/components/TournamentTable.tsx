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
    <div className="overflow-x-auto">
      <Table className="min-w-full table-fixed">
        <TableHeader>
          <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              #
            </TableHead>
            <TableHead className="w-[32%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("tournaments.tournamentName")}
            </TableHead>
            <TableHead className="w-[26%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("tournaments.club")}
            </TableHead>
            <TableHead className="w-[18%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("tournaments.date")}
            </TableHead>
            <TableHead className="w-[24%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("tournaments.action")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament, idx) => {
            const { canEditDraft, canPublishDraft } = getRowPermissions(tournament.status);

            return (
              <TableRow
                key={tournament.id}
                className="border-border bg-card hover:bg-muted/30"
              >
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                  {(pagination.page - 1) * pagination.limit + idx + 1}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className="font-medium text-foreground">{tournament.name}</span>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                  {tournament.club?.name ?? "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDateDisplay(
                    tournament.date,
                    t("tournaments.unscheduled"),
                    getDateFnsLocale(language)
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
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
                        variant="outline"
                        size="sm"
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
