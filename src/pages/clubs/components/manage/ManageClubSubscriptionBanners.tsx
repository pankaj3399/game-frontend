import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { getDateFnsLocale } from "@/lib/dateFnsLocale";
import type { ClubSubscription } from "@/pages/clubs/hooks/useClubStaff";
import { isSubscriptionExpiredByLocalDay } from "@/utils/date";

interface ManageClubSubscriptionBannersProps {
  roleMode: "super_admin" | "club_admin_or_organiser";
  showPremiumBanner: boolean;
  showSubscriptionBanner: boolean;
  subscription: ClubSubscription | undefined;
  onRenew: () => void;
}

export function ManageClubSubscriptionBanners({
  roleMode,
  showPremiumBanner,
  showSubscriptionBanner,
  subscription,
  onRenew,
}: ManageClubSubscriptionBannersProps) {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);

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
      {showPremiumBanner && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-[12px] border border-[rgba(48,131,234,0.10)] bg-[rgba(48,131,234,0.13)] px-[15px] py-[15px] text-[#00339a]">
          <div className="flex min-w-0 flex-1 items-start gap-[12px]">
            <HugeiconsIcon icon={CrownIcon} size={20} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[16px] font-semibold">{t("manageClub.premiumClub")}</p>
              <p className="text-[13px]">{t("manageClub.premiumEnabled")}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[13px] opacity-80">{t("manageClub.expiresOn")}</p>
            <p className="text-xl leading-none font-medium">
              {subscription?.expiresAt ? format(subscription.expiresAt, "PPP", { locale }) : "--"}
            </p>
          </div>
        </div>
      )}

      {showSubscriptionBanner && (
        <div className="mt-5 flex flex-col gap-3 rounded-[12px] border border-black/10 bg-[rgba(244,201,93,0.13)] px-[15px] py-[15px] sm:flex-row sm:items-center sm:justify-between sm:gap-[25px]">
          <div className="min-w-0 flex flex-1 items-start gap-[14px] text-[#906500]">
            <HugeiconsIcon icon={InformationCircleIcon} size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[14px] font-medium">{t("manageClub.subscriptionBannerTitle")}</p>
              <p className="mt-2 text-[13px] leading-[1.25]">
                {subscriptionBannerCopy.date === undefined
                  ? t(subscriptionBannerCopy.key)
                  : t(subscriptionBannerCopy.key, { date: subscriptionBannerCopy.date })}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-[30px] w-full shrink-0 self-start rounded-[8px] bg-[#010a04] px-[18px] text-[14px] text-white hover:bg-[#010a04]/90 sm:w-auto sm:self-center"
            onClick={onRenew}
          >
            {roleMode === "super_admin"
              ? t("manageClub.renewNow")
              : t("manageClub.requestRenewal")}
          </Button>
        </div>
      )}
    </>
  );
}
