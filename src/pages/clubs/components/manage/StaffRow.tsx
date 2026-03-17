import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DragDropVerticalIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ClubStaffMember } from "@/pages/clubs/hooks";

function StaffAvatar({ name, alias }: { name: string | null; alias: string | null }) {
  const display = (alias?.trim() || name?.trim() || "?").slice(0, 2).toUpperCase();

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
      aria-hidden
    >
      {display}
    </div>
  );
}

interface StaffRowProps {
  member: ClubStaffMember;
  onMenuAction?: (action: string, memberId: string) => void;
}

export function StaffRow({ member, onMenuAction }: StaffRowProps) {
  const { t } = useTranslation();
  const isDefault = member.role === "default_admin";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label={t("manageClub.dragUser")}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
      </button>
      <StaffAvatar name={member.name} alias={member.alias} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">
          {member.name?.trim() || member.alias?.trim() || member.email}
        </p>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>
      <div className="flex items-center gap-2">
        {isDefault && (
          <span className="rounded-full bg-brand-primary px-2.5 py-0.5 text-xs font-medium text-white">
            {t("manageClub.default")}
          </span>
        )}
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            isDefault ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {member.roleLabel}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <HugeiconsIcon icon={MoreVerticalIcon} size={16} aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onMenuAction?.("edit", member.id)}
            className="cursor-pointer"
          >
            {t("manageClub.editRole")}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onMenuAction?.("remove", member.id)}
            className="cursor-pointer"
          >
            {t("manageClub.remove")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
