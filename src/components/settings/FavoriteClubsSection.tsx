import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Delete01Icon,
  Home01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useSearchClubs,
  useFavoriteClubs,
  useAddFavoriteClub,
  useRemoveFavoriteClub,
  useSetHomeClub,
} from "@/hooks/club";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export function FavoriteClubsSection() {
  const { t } = useTranslation();
  const { data } = useFavoriteClubs();
  const [searchInput, setSearchInput] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const favoriteClubs = data?.favoriteClubs ?? [];
  const homeClubId = data?.homeClub?.id ?? null;

  const { data: searchResults = [], isLoading: searchLoading } = useSearchClubs(
    searchInput
  );
  const addFavorite = useAddFavoriteClub();
  const removeFavorite = useRemoveFavoriteClub();
  const setHomeClub = useSetHomeClub();

  async function handleAddFavorite(clubId: string) {
    const alreadyAdded = favoriteClubs.some((c) => c.id === clubId);
    if (alreadyAdded) {
      toast.error(t("settings.favoriteClubsAlreadyAdded"));
      return;
    }
    try {
      await addFavorite.mutateAsync(clubId);
      toast.success(t("settings.favoriteClubsAddSuccess"));
      setSearchInput("");
      setDropdownOpen(false);
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) ?? t("settings.favoriteClubsAddError")
      );
    }
  }

  
  async function handleRemoveFavorite(clubId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await removeFavorite.mutateAsync(clubId);
      toast.success(t("settings.favoriteClubsRemoveSuccess"));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) ?? t("settings.favoriteClubsRemoveError")
      );
    }
  }

  async function handleSetHomeClub(clubId: string) {
    if (clubId === homeClubId) return;
    try {
      await setHomeClub.mutateAsync(clubId);
      toast.success(t("settings.favoriteClubsHomeSetSuccess"));
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) ?? t("settings.favoriteClubsHomeSetError")
      );
    }
  }

  const filteredResults = searchResults.filter(
    (c) => !favoriteClubs.some((f) => f.id === c.id)
  );
  const firstResult = filteredResults[0];

  return (
    <>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground flex w-full justify-between">
          {t("settings.favoriteClubsTitle")}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-muted-foreground hover:bg-[#f3f4f6] hover:text-foreground transition-colors"
                aria-label={t("settings.favoriteClubsInfoAria")}
              >
                <HugeiconsIcon icon={InformationCircleIcon} size={16} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <p className="text-sm text-muted-foreground">
                {t("settings.favoriteClubsInfoTooltip")}
              </p>
            </PopoverContent>
          </Popover>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="text"
              placeholder={t("settings.favoriteClubsSearchPlaceholder")}
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => searchInput && setDropdownOpen(true)}
              onBlur={() =>
                setTimeout(() => setDropdownOpen(false), 150)
              }
              className="h-11 pl-10 w-full rounded-lg border border-[#e5e7eb] bg-white text-sm placeholder:text-muted-foreground"
            />
            {dropdownOpen && searchInput.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-lg border border-[#e5e7eb] bg-white shadow-md max-h-48 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    {t("common.loading")}
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    {t("settings.favoriteClubsNoResults")}
                  </div>
                ) : (
                  filteredResults.map((club) => (
                    <button
                      key={club.id}
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#f3f4f6] first:rounded-t-lg last:rounded-b-lg"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleAddFavorite(club.id);
                      }}
                    >
                      {club.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <Button
            type="button"
            disabled={!firstResult || addFavorite.isPending}
            onClick={() => firstResult && handleAddFavorite(firstResult.id)}
            className="h-11 px-5 rounded-lg font-medium shrink-0 bg-brand-accent text-black hover:bg-brand-accent-hover"
          >
            {addFavorite.isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              t("settings.favoriteClubsAddButton")
            )}
          </Button>
       
        </div>

        <div className="flex flex-wrap gap-2">
          {favoriteClubs.map((club) => {
            const isHome = club.id === homeClubId;
            return (
              <div
                key={club.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSetHomeClub(club.id)}
                onKeyDown={(e) => {
                  if(e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSetHomeClub(club.id);
                  }
                }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  isHome
                    ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/30"
                    : "bg-white text-foreground border border-[#e5e7eb] hover:border-[#9ca3af]"
                }`}
              >
                <span>{club.name}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveFavorite(club.id, e)}
                  disabled={removeFavorite.isPending}
                  className="rounded p-0.5 hover:bg-black/10 transition-colors disabled:opacity-50"
                  aria-label={t("settings.favoriteClubsRemoveAria", {
                    name: club.name,
                  })}
                >
                  <HugeiconsIcon icon={Delete01Icon} size={16} />
                </button>
                {isHome && (
                  <HugeiconsIcon
                    icon={Home01Icon}
                    size={16}
                    className="text-brand-primary"
                    aria-label={t("settings.favoriteClubsHomeAria")}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          {t("settings.favoriteClubsSelectHomeHint")}
        </p>
      </div>
    </>
  );
}
