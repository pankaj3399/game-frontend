import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import InlineLoader from "@/components/shared/InlineLoader";
import {
  useSearchUsers,
  isUserSearchQueryValid,
  type SearchUserResult,
} from "@/pages/clubs/hooks";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

interface UserSearchSelectProps {
  inputId?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelectUser: (user: SearchUserResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  noResultsText?: string;
  keepTypingText?: string;
  userFilter?: (user: SearchUserResult) => boolean;
  primaryText?: (user: SearchUserResult) => string;
}

export function UserSearchSelect({
  inputId,
  value,
  onValueChange,
  onSelectUser,
  placeholder,
  className,
  disabled = false,
  noResultsText,
  keepTypingText,
  userFilter,
  primaryText,
}: UserSearchSelectProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("userSearch.placeholder");
  const resolvedNoResults = noResultsText ?? t("userSearch.noResults");
  const resolvedKeepTyping = keepTypingText ?? t("userSearch.keepTyping");

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  const trimmedValue = value.trim();
  const debouncedValue = useDebouncedValue(trimmedValue, 300);
  const canSearch = isUserSearchQueryValid(trimmedValue);
  const canSearchDebounced = isUserSearchQueryValid(debouncedValue);

  const { data, isLoading, isFetching } = useSearchUsers(trimmedValue, canSearch && open);

  const allUsers = data?.users ?? [];
  const users = userFilter ? allUsers.filter(userFilter) : allUsers;

  const isDebouncing = trimmedValue !== debouncedValue;
  const showSuggestions = open;
  const showLoadingState = showSuggestions && canSearch && (isDebouncing || isLoading || isFetching);
  const showResults =
    showSuggestions &&
    canSearchDebounced &&
    !showLoadingState &&
    users.length > 0;
  const showNoResults =
    showSuggestions &&
    canSearchDebounced &&
    !showLoadingState &&
    users.length === 0;
  const showKeepTyping = showSuggestions && !canSearchDebounced && !showLoadingState;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className={cn("relative", className)}>
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={inputId}
            value={value}
            onChange={(event) => {
              onValueChange(event.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={resolvedPlaceholder}
            className="pl-9"
            autoComplete="off"
            disabled={disabled}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        className="p-0"
        style={{ width: anchorRef.current?.getBoundingClientRect().width ?? 320 }}
        align="start"
        side="bottom"
        sideOffset={6}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          const target = event.target as Node | null;
          if (target && anchorRef.current?.contains(target)) {
            event.preventDefault();
          }
        }}
      >
        <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {showLoadingState ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <InlineLoader className="h-5 w-5" size="sm" />
              <span>{t("userSearch.searching")}</span>
            </div>
          ) : showNoResults ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">{resolvedNoResults}</p>
          ) : showResults ? (
            <ul className="py-1">
              {users.map((user) => {
                const alias = user.alias?.trim();
                const display = primaryText?.(user) ?? alias ?? user.name?.trim() ?? user.email;

                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelectUser(user);
                        setOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent/60"
                    >
                      <span className="font-medium text-foreground">{display}</span>
                      <span className="ml-2 text-muted-foreground">{user.email}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : showKeepTyping ? (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">{resolvedKeepTyping}</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
