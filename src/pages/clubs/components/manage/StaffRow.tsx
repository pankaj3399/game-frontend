import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DragDropVerticalIcon,
  CrownIcon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ClubStaffMember } from "@/pages/clubs/hooks";

function StaffAvatar({ name, alias }: { name: string | null; alias: string | null }) {
  const display = (alias?.trim() || name?.trim() || "").slice(0, 2).toUpperCase();

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8d8d8] text-[11px] font-medium text-[#010a04]/50"
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
  const roleLabel = isDefault ? t("manageClub.mainAdmin") : member.roleLabel;
  const memberDisplayName = member.name?.trim() || member.alias?.trim() || member.email;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-[12px] border px-[12px] py-[15px] shadow-[0px_0px_6px_0px_rgba(0,0,0,0.02),0px_2px_4px_0px_rgba(0,0,0,0.08)]",
        isDefault
          ? "border-[rgba(10,105,37,0.17)] bg-[linear-gradient(90deg,rgba(10,105,37,0.06)_0%,rgba(10,105,37,0.06)_100%),linear-gradient(90deg,#fff_0%,#fff_100%)]"
          : "border-black/12 bg-white"
      )}
    >
      <button
        type="button"
        className="mr-3 cursor-grab touch-none text-[#010a04]/45 hover:text-[#010a04]/70"
        aria-label={t("manageClub.dragUser")}
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={20} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-[14px]">
        <StaffAvatar name={member.name} alias={member.alias} />
        <div className="min-w-0">
          <div className="flex items-center gap-[7px]">
            <p className="truncate text-[16px] font-medium text-[#010a04]">{memberDisplayName}</p>
            {isDefault && (
              <span className="inline-flex h-[18px] items-center gap-1 rounded-[5px] bg-[rgba(10,105,37,0.12)] px-[6px] pr-[8px] text-[10px] font-medium text-brand-primary">
                <HugeiconsIcon icon={CrownIcon} size={10} />
                {t("manageClub.default")}
              </span>
            )}
          </div>
          <p className="truncate text-[12px] text-[#010a04]/60">{member.email}</p>
          <p className="truncate text-[12px] text-[#010a04]/60">{roleLabel}</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center text-[#010a04]/45"
            aria-label={t("manageClub.staffActionsMenu", { name: memberDisplayName })}
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={18} aria-hidden />
          </button>
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
