import { useTranslation } from "react-i18next";
import {
  APP_LANGUAGES,
  getAppLanguageMeta,
  resolveAppLanguage,
  type AppLanguageCode,
} from "@/lib/appLanguages";
import { cn } from "@/lib/utils";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type LanguagePickerProps = {
  onAfterChange?: () => void;
};

export function useAppLanguage() {
  const { i18n } = useTranslation();
  const currentCode = resolveAppLanguage(i18n.resolvedLanguage);
  const current = getAppLanguageMeta(currentCode);

  const changeLanguage = (code: AppLanguageCode) => {
    if (code !== currentCode) {
      void i18n.changeLanguage(code);
    }
  };

  return { currentCode, current, changeLanguage };
}

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

export function LanguagePickerSheet({
  onAfterChange,
}: Pick<LanguagePickerProps, "onAfterChange">) {
  const { t } = useTranslation();
  const { currentCode, changeLanguage } = useAppLanguage();

  return (
    <div>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
        {t("common.language")}
      </p>
      <div
        className="flex max-h-[min(14rem,40vh)] flex-col gap-1 overflow-y-auto rounded-[10px] border border-white/15 bg-white/[0.04] p-1"
        role="listbox"
        aria-label={t("common.language")}
      >
        {APP_LANGUAGES.map((language) => {
          const isSelected = language.code === currentCode;
          return (
            <button
              key={language.code}
              type="button"
              role="option"
              aria-selected={isSelected}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2.5 text-left text-[13px] transition-colors",
                isSelected
                  ? "bg-white font-semibold text-brand-primary shadow-sm"
                  : "font-medium text-white/90 hover:bg-white/10 hover:text-white",
              )}
              onClick={() => {
                changeLanguage(language.code);
                onAfterChange?.();
              }}
            >
              <span>{language.nativeName}</span>
              <span
                className={cn(
                  "text-[11px] font-semibold tabular-nums uppercase tracking-wide",
                  isSelected ? "text-brand-primary/70" : "text-white/50",
                )}
              >
                {language.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
