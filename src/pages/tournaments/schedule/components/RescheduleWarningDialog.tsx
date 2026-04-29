import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  round: number;
  scoredMatches: number;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: (k: string, opts?: Record<string, unknown>) => string;
};

export default function RescheduleWarningDialog({
  open,
  onOpenChange,
  round,
  scoredMatches,
  isPending = false,
  onCancel,
  onConfirm,
  t,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("tournaments.scheduleRescheduleWarningTitle", { round })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("tournaments.scheduleRescheduleWarningDescription", {
              count: scoredMatches,
              round,
              scoredMatches,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={onCancel}>
            {t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {t("tournaments.scheduleRescheduleWarningConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
