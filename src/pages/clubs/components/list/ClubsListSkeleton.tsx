import { useTranslation } from "react-i18next";

export function ClubsListSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">{t("common.loading")}</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-skeleton-soft rounded-[14px] border border-border bg-white p-4 shadow-sm"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

