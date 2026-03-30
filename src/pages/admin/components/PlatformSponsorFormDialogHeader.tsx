import { useTranslation } from "react-i18next";
import { X } from "@/icons/figma-icons";
import { DialogClose } from "@/components/ui/dialog";

export function PlatformSponsorFormDialogHeader({ title }: { title: string }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-[21px] font-semibold leading-none text-[#010a04]">{title}</h2>
        <DialogClose asChild>
          <button
            type="button"
            className="inline-flex size-6 items-center justify-center rounded-md text-[#010a04]"
            aria-label={t("admin.platformSponsors.closeAria")}
          >
            <X className="size-[18px]" />
          </button>
        </DialogClose>
      </div>

      <div className="mt-[18px] mb-[22px] h-px w-full bg-black/10" />
    </>
  );
}
