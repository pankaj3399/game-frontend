import { useId } from "react";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ListFilterIcon from "@/assets/icons/figma/misc/list-filter.svg?react";

interface TournamentFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  status?: string;
  canShowStatusFilter: boolean;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function TournamentFilters({
  open,
  onOpenChange,
  query,
  status,
  canShowStatusFilter,
  onQueryChange,
  onStatusChange,
}: TournamentFiltersProps) {
  const { t } = useTranslation();
  const statusFilterLabelId = useId();
  const queryFilterLabelId = useId();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <span className="inline-flex mr-2" style={{ width: 16, height: 16 }}>
            <ListFilterIcon width={16} height={16} aria-hidden />
          </span>
          {t("tournaments.filters")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-4">
        <div className="space-y-4">
          <div>
            <label
              id={queryFilterLabelId}
              className="mb-2 block text-xs font-medium text-muted-foreground"
            >
              {t("tournaments.filterSearch")}
            </label>
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t("tournaments.filterSearchPlaceholder")}
              className="h-9"
              aria-labelledby={queryFilterLabelId}
            />
          </div>
          {canShowStatusFilter && (
            <div>
              <label
                id={statusFilterLabelId}
                className="mb-2 block text-xs font-medium text-muted-foreground"
              >
                {t("tournaments.filterStatus")}
              </label>
              <Select value={status ?? "all"} onValueChange={onStatusChange}>
                <SelectTrigger className="h-9" aria-labelledby={statusFilterLabelId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("tournaments.allStatuses")}</SelectItem>
                  <SelectItem value="active">{t("tournaments.statusActive")}</SelectItem>
                  <SelectItem value="inactive">{t("tournaments.statusInactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {t("tournaments.applyFilters")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
