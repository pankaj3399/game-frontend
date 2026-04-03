import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import { PlusSignIcon } from "@/icons/figma-icons";
import { Button } from "@/components/ui/button";
import type { ClubStaffMember } from "@/pages/clubs/hooks";
import { StaffRow } from "./StaffRow";

interface ManageClubStaffSectionProps {
  staff: ClubStaffMember[];
  staffLoading: boolean;
  canAddStaff: boolean;
  canSetMainAdmin: boolean;
  currentMainAdminId: string | null;
  onOpenAddModal: () => void;
  onMenuAction?: (action: "edit" | "remove", member: ClubStaffMember) => void;
  onMainAdminChange?: (
    newMainAdminId: string,
    orderedIds?: string[],
  ) => Promise<boolean>;
}

export function ManageClubStaffSection({
  staff,
  staffLoading,
  canAddStaff,
  canSetMainAdmin,
  currentMainAdminId,
  onOpenAddModal,
  onMenuAction,
  onMainAdminChange,
}: ManageClubStaffSectionProps) {
  const { t } = useTranslation();
  const [pendingMainAdminId, setPendingMainAdminId] = useState<string | null>(
    null,
  );
  const isMainAdminChangePending = pendingMainAdminId !== null;
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const canonicalMainAdminId =
    staff.find((member) => member.role === "default_admin")?.id ??
    currentMainAdminId;

  const orderedStaff: ClubStaffMember[] = staff.map((member) => {
      if (!pendingMainAdminId) {
        return member;
      }

      if (member.id === pendingMainAdminId && member.role !== "default_admin") {
        return {
          ...member,
          role: "default_admin",
          roleLabel: t("manageClub.mainAdmin"),
        };
      }

      if (
        canonicalMainAdminId &&
        member.id === canonicalMainAdminId &&
        member.id !== pendingMainAdminId &&
        member.role === "default_admin"
      ) {
        return {
          ...member,
          role: "admin",
          roleLabel: t("manageClub.roleAdmin"),
        };
      }

      return member;
    });

  const staffIds: UniqueIdentifier[] = orderedStaff.map((member) => member.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || isMainAdminChangePending) {
      return;
    }

    if (!canSetMainAdmin || !onMainAdminChange) {
      return;
    }

    const sourceIndex = orderedStaff.findIndex(
      (member) => member.id === active.id,
    );
    const targetIndex = orderedStaff.findIndex(
      (member) => member.id === over.id,
    );

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const draggedMember = orderedStaff[sourceIndex];
    if (
      draggedMember.role !== "admin" &&
      draggedMember.role !== "default_admin"
    ) {
      return;
    }

    const next = arrayMove(orderedStaff, sourceIndex, targetIndex);
    const nextTopMember = next[0];

    if (
      !nextTopMember ||
      (nextTopMember.role !== "admin" &&
        nextTopMember.role !== "default_admin")
    ) {
      return;
    }

    if (nextTopMember.id === currentMainAdminId) {
      return;
    }

    const nextIds = next.map((member) => member.id);
    setPendingMainAdminId(nextTopMember.id);

    void onMainAdminChange(nextTopMember.id, nextIds).finally(() => {
      setPendingMainAdminId(null);
    });
  };

  if (staffLoading) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`staff-skeleton-${index}`}
            className="rounded-[12px] border border-black/8 bg-white px-[12px] py-[15px]"
          >
            <div className="flex items-center gap-3 animate-pulse">
              <div className="h-5 w-5 rounded bg-[#e9edf3]" />
              <div className="h-10 w-10 rounded-full bg-[#e9edf3]" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-44 rounded bg-[#e9edf3]" />
                <div className="h-3 w-56 rounded bg-[#eef2f7]" />
                <div className="h-3 w-24 rounded bg-[#eef2f7]" />
              </div>
              <div className="h-5 w-5 rounded bg-[#e9edf3]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
        <p className="text-muted-foreground">{t("manageClub.noStaff")}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onOpenAddModal}
          disabled={!canAddStaff}
          title={
            !canAddStaff ? t("manageClub.addMemberDisabledHint") : undefined
          }
        >
          <PlusSignIcon size={16} className="mr-2" />
          {t("manageClub.addMember")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={staffIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {orderedStaff.map((member) => (
              <StaffRow
                key={member.id}
                member={member}
                canSetMainAdmin={canSetMainAdmin && !isMainAdminChangePending}
                isMainAdminUpdatePending={pendingMainAdminId === member.id}
                onMenuAction={onMenuAction}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
