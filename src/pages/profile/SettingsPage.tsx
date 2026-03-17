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
    <div className="py-6 sm:py-8 px-4 sm:px-6 bg-gray-50 h-max">
      <div className="mx-auto w-full max-w-3xl min-w-0">
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <Tabs value={activeTab ?? undefined} onValueChange={handleTabChange} className="w-full">
            <div className="border-b border-[#e5e7eb] px-4 sm:px-6 pt-4 pb-4">
              <TabsList className="h-auto w-full grid grid-cols-2 sm:flex sm:flex-wrap justify-start gap-2 rounded-md bg-transparent p-0">
                <TabsTrigger
                  value="settings"
                  className="flex-none rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-foreground data-[state=inactive]:bg-transparent"
                >
                  {t("settings.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="favorite-clubs"
                  className="flex-none rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-foreground data-[state=inactive]:bg-transparent"
                >
                  {t("settings.favoriteClubs")}
                </TabsTrigger>
                <TabsTrigger
                  value="admin-clubs"
                  className="flex-none rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-foreground data-[state=inactive]:bg-transparent"
                >
                  {t("settings.clubsIAdministrate")}
                </TabsTrigger>
                <TabsTrigger
                  value="delete-account"
                  className="flex-none rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors data-[state=active]:bg-[#f3f4f6] data-[state=active]:text-foreground data-[state=inactive]:bg-transparent"
                >
                  {t("settings.deleteAccount")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="settings" className="mt-0 p-4 sm:p-6">
              <SettingsForm
                key={`${user.id}-${dataUpdatedAt ?? 0}`}
                user={user}
              />
            </TabsContent>

            <TabsContent value="favorite-clubs" className="mt-0 p-4 sm:p-6">
              <FavoriteClubsSection />
            </TabsContent>

            <TabsContent value="admin-clubs" className="mt-0 p-4 sm:p-6">
              <AdminClubsSection />
            </TabsContent>

            <TabsContent value="delete-account" className="mt-0 p-4 sm:p-6">
              <DeleteAccountSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
