import { Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCurrentUser } from "@/pages/auth/hooks";
import {
  SettingsForm,
  DeleteAccountSection,
  FavoriteClubsSection,
  AdminClubsSection,
} from "@/pages/profile/components/settings";
import InlineLoader from "@/components/shared/InlineLoader";

const VALID_TABS = ["settings", "favorite-clubs", "admin-clubs", "delete-account"];

const tabTriggerClassName =
  "h-[30px] flex-none shrink-0 rounded-[8px] px-[12px] py-2 text-[12px] font-medium text-[#010a04]/70 transition-all sm:text-[14px] data-[state=active]:bg-white data-[state=active]:text-[#010a04] data-[state=active]:shadow-[0px_0px_4px_0px_rgba(0,0,0,0.04),0px_4px_8px_0px_rgba(0,0,0,0.06)]";

const tabContentClassName =
  "mt-0 min-w-0 overflow-hidden rounded-[12px] border border-[rgba(1,10,4,0.08)] bg-white p-5 shadow-[0px_3px_15px_0px_rgba(0,0,0,0.06)]";

function isSettingsTab(value: string | null) {
  return value !== null && VALID_TABS.includes(value);
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: userLoading, isAuthenticated, isProfileComplete, dataUpdatedAt } =
    useCurrentUser();

  const tabParam = searchParams.get("tab");
  const activeTab = isSettingsTab(tabParam) ? tabParam : "settings";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-8">
        <InlineLoader />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex w-full flex-1 flex-col bg-[#f8fbf8] px-5 pb-10 pt-[30px] sm:px-6 sm:pt-[45px] lg:px-0">
      <div className="mx-auto w-full max-w-[880px] min-w-0">
        <Tabs value={activeTab ?? undefined} onValueChange={handleTabChange} className="w-full min-w-0">
          <div className="mb-4 w-fit max-w-full overflow-x-auto rounded-[10px] bg-[rgba(1,10,4,0.05)] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="h-auto w-fit min-w-max justify-start gap-0 rounded-none bg-transparent p-0">
              <TabsTrigger
                value="settings"
                className={`${tabTriggerClassName} sm:px-[15px]`}
              >
                {t("settings.title")}
              </TabsTrigger>
              <TabsTrigger
                value="favorite-clubs"
                  className={`${tabTriggerClassName} sm:px-[15px]`}
              >
                {t("settings.favoriteClubs")}
              </TabsTrigger>
              <TabsTrigger
                value="admin-clubs"
                  className={`${tabTriggerClassName} sm:px-[15px]`}
              >
                {t("settings.clubsIAdministrate")}
              </TabsTrigger>
              <TabsTrigger
                value="delete-account"
                className={`${tabTriggerClassName} sm:px-[15px]`}
              >
                {t("settings.deleteAccount")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="settings" className={tabContentClassName}>
            <SettingsForm
              key={`${user.id}-${dataUpdatedAt ?? 0}`}
              user={user}
            />
          </TabsContent>

          <TabsContent value="favorite-clubs" className={tabContentClassName}>
            <FavoriteClubsSection enabled={activeTab === "favorite-clubs"} />
          </TabsContent>

          <TabsContent value="admin-clubs" className={tabContentClassName}>
            <AdminClubsSection enabled={activeTab === "admin-clubs"} />
          </TabsContent>

          <TabsContent value="delete-account" className={tabContentClassName}>
            <DeleteAccountSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
