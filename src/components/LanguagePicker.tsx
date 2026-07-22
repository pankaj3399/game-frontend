import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { APP_LANGUAGES, type AppLanguageCode } from "@/lib/appLanguages";
import { cn } from "@/lib/utils";
import { useAppLanguage } from "@/hooks/useAppLanguage";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LanguagePickerProps = {
  onAfterChange?: () => void;
  /** When false, forces the mobile select closed so Radix does not leave overlays active. */
  sheetOpen?: boolean;
};

export function LanguagePickerDropdownItems({
  onAfterChange,
}: Pick<LanguagePickerProps, "onAfterChange">) {
  const { currentCode, changeLanguage } = useAppLanguage();

  return (
    <>
      {APP_LANGUAGES.map((language) => (
        <DropdownMenuItem
          key={language.code}
          className={cn(
            "cursor-pointer",
            language.code === currentCode && "bg-accent font-medium",
          )}
          onClick={() => {
            changeLanguage(language.code);
            onAfterChange?.();
          }}
        >
          <span className="flex w-full items-center justify-between gap-3">
            <span>{language.nativeName}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {language.shortLabel}
            </span>
          </span>
        </DropdownMenuItem>
      ))}
    </>
  );
}

const sheetSelectTriggerClassName =
  "h-10 w-full rounded-[9px] border border-white/20 bg-white/10 px-3 text-[14px] font-medium text-white shadow-none transition-colors hover:bg-white/15 focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-0 data-[placeholder]:text-white/70 [&_svg]:text-white/80";

const sheetSelectContentClassName =
  "z-[60] max-h-[min(16rem,50vh)] border-white/15 bg-brand-primary text-white";

const sheetSelectItemClassName =
  "focus:bg-white/15 focus:text-white data-highlighted:bg-white/15 data-highlighted:text-white";

export function LanguagePickerSheet({
  onAfterChange,
  sheetOpen = true,
}: LanguagePickerProps) {
  const { t } = useTranslation();
  const { currentCode, changeLanguage } = useAppLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const sheetContent = rootRef.current?.closest('[data-slot="sheet-content"]');
    setPortalContainer(sheetContent instanceof HTMLElement ? sheetContent : null);
  }, []);

  const handleValueChange = (value: string) => {
    const code = value as AppLanguageCode;
    setSelectOpen(false);
    if (code === currentCode) {
      return;
    }
    changeLanguage(code);
    onAfterChange?.();
  };

  return (
    <div ref={rootRef} className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
        {t("common.language")}
      </p>
      <Select
        value={currentCode}
        open={sheetOpen && selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          aria-label={t("common.language")}
          className={sheetSelectTriggerClassName}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          container={portalContainer}
          position="popper"
          side="top"
          align="start"
          sideOffset={6}
          showScrollButtons={false}
          className={sheetSelectContentClassName}
        >
          {APP_LANGUAGES.map((language) => (
            <SelectItem
              key={language.code}
              value={language.code}
              className={sheetSelectItemClassName}
              textValue={language.nativeName}
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span>{language.nativeName}</span>
                <span className="text-xs tabular-nums text-white/55">
                  {language.shortLabel}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
