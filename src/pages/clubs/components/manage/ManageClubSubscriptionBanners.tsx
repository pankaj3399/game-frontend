import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import type { ClubSubscription } from "@/pages/clubs/hooks/useClubStaff";
import { isSubscriptionExpiredByLocalDay } from "@/utils/date";

interface ManageClubSubscriptionBannersProps {
  showSubscriptionBanner: boolean;
  showUpgradeBanner: boolean;
  subscription: ClubSubscription | undefined;
  onRenew: () => void;
  onUpgrade: () => void;
}

export function ManageClubSubscriptionBanners({
  showSubscriptionBanner,
  showUpgradeBanner,
  subscription,
  onRenew,
  onUpgrade,
}: ManageClubSubscriptionBannersProps) {
  const { t, i18n } = useTranslation();

  let subscriptionBannerCopy: {
    key: "manageClub.subscriptionBannerUnknownExpiry" | "manageClub.subscriptionBannerExpiredOn" | "manageClub.subscriptionBannerExpiresOn",
    date: string | undefined
  };

  const expiresAt = subscription?.expiresAt ?? null;
  if (!expiresAt) {
    subscriptionBannerCopy = {
      key: "manageClub.subscriptionBannerUnknownExpiry",
      date: undefined,
    };
  } else {
    const locale = getDateFnsLocale(i18n.language);
    const date = format(expiresAt, "PPP", { locale });
    if (isSubscriptionExpiredByLocalDay(expiresAt)) {
      subscriptionBannerCopy = {
        key: "manageClub.subscriptionBannerExpiredOn",
        date,
      };
    } else {
      subscriptionBannerCopy = {
        key: "manageClub.subscriptionBannerExpiresOn",
        date,
      };
    }
  }

  return (
    <>
      {showSubscriptionBanner && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={20}
              className="shrink-0 text-amber-600 dark:text-amber-400"
            />
            <p className="text-sm text-foreground">
              {subscriptionBannerCopy.date === undefined
                ? t(subscriptionBannerCopy.key)
                : t(subscriptionBannerCopy.key, { date: subscriptionBannerCopy.date })}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 bg-gray-800 text-white hover:bg-gray-700"
            onClick={onRenew}
          >
            {t("manageClub.renewNow")}
          </Button>
        </div>
      )}

      {showUpgradeBanner && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-brand-primary/30 bg-brand-primary/5 px-4 py-3 dark:border-brand-primary/40 dark:bg-brand-primary/10">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <HugeiconsIcon icon={SparklesIcon} size={20} className="shrink-0 text-brand-primary" />
            <p className="text-sm text-muted-foreground">{t("manageClub.upgradeBannerBenefits")}</p>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover"
            onClick={onUpgrade}
          >
            {t("manageClub.upgradeToPremium")}
          </Button>
        </div>
      )}
    </>
  );
}
