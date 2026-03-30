import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search01Icon,
  Delete01Icon,
} from "@/icons/figma-icons";
import { House, Info } from "@/icons/figma-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useSearchClubs,
  useFavoriteClubs,
  useAddFavoriteClub,
  useRemoveFavoriteClub,
  useSetHomeClub,
} from "@/pages/profile/hooks";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import InlineLoader from "@/components/shared/InlineLoader";

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
      <div className="flex flex-col gap-[25px]">
        <div className="flex w-full items-center justify-between">
          <h2 className="text-[20px] font-semibold text-[#010a04]">
            {t("settings.favoriteClubsTitle")}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-[#010a04]/55 hover:text-[#010a04]/70"
                aria-label={t("settings.favoriteClubsInfoAria")}
              >
                <Info size={20} strokeWidth={1.8} aria-hidden />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(100vw-2rem,20rem)]">
              <PopoverDescription className="text-[14px] leading-snug text-[#010a04]/85">
                {t("settings.favoriteClubsInfoTooltip")}
              </PopoverDescription>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full flex-1">
            <Search01Icon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#010a04]/50"
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
              className="h-[38px] w-full rounded-[8px] border border-[#e1e3e8] bg-white pl-10 text-[14px] text-[#010a04] placeholder:text-[#010a04]/50"
            />
            {dropdownOpen && searchInput.trim() && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-[8px] border border-[#e1e3e8] bg-white shadow-md">
                {searchLoading ? (
                  <div className="p-3 text-sm text-[#010a04]/60">
                    {t("common.loading")}
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="p-3 text-sm text-[#010a04]/60">
                    {t("settings.favoriteClubsNoResults")}
                  </div>
                ) : (
                  filteredResults.map((club) => (
                    <button
                      key={club.id}
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-[#f3f4f6] first:rounded-t-[8px] last:rounded-b-[8px]"
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
            className="h-[32px] w-full rounded-[8px] border border-[rgba(1,10,4,0.12)] bg-brand-accent px-[15px] text-[12px] font-medium text-[#010a04] hover:bg-brand-accent-hover sm:h-[38px] sm:w-auto sm:shrink-0"
          >
            <span className="inline-flex items-center gap-2">
              {t("settings.favoriteClubsAddButton")}
              {addFavorite.isPending && <InlineLoader size="sm" />}
            </span>
          </Button>
       
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                className={`flex items-center justify-between gap-3 rounded-[10px] border px-[14px] py-[15px] text-[16px] font-medium transition-colors cursor-pointer sm:rounded-[12px] sm:py-[8px] ${
                  isHome
                    ? "border-[rgba(6,116,41,0.1)] bg-[rgba(6,116,41,0.07)] text-[#010a04]"
                    : "border-[#e1e3e8] bg-[#f9fafc] text-[#010a04] hover:border-[#cdd2da]"
                }`}
              >
                <span className="truncate">{club.name}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFavorite(club.id, e)}
                    disabled={removeFavorite.isPending}
                    className="text-[#010a04]/45 transition-colors hover:text-[#010a04]/70 disabled:opacity-50"
                    aria-label={t("settings.favoriteClubsRemoveAria", {
                      name: club.name,
                    })}
                  >
                    <Delete01Icon size={16} className="sm:size-[18px]" />
                  </button>
                  {isHome && (
                    <House
                      size={16}
                      strokeWidth={2}
                      className="text-[#067429]"
                      aria-label={t("settings.favoriteClubsHomeAria")}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[14px] text-[#010a04]/50">
          {t("settings.favoriteClubsSelectHomeHint")}
        </p>
      </div>
    </>
  );
}
