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
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";

interface TournamentFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: string;
  canShowStatusFilter: boolean;
  onStatusChange: (value: string) => void;
}

export function TournamentFilters({
  open,
  onOpenChange,
  status,
  canShowStatusFilter,
  onStatusChange,
}: TournamentFiltersProps) {
  const { t } = useTranslation();
  const statusFilterLabelId = useId();

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={Settings01Icon} size={16} className="mr-2" />
          {t("tournaments.filters")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-4">
        <div className="space-y-4">
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
