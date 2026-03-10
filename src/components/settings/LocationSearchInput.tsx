import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useMapboxSearch, type MapboxFeature } from "@/hooks/useMapboxSearch";
import { cn } from "@/lib/utils";

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (feature: MapboxFeature) => void;
  placeholder?: string;
  searchingLabel?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationSearchInput({
  value,
  onChange,
  onSelect,
  placeholder,
  searchingLabel = "Searching...",
  id,
  disabled,
  className,
}: LocationSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { results, isLoading, error, hasToken } = useMapboxSearch(value);

  const showDropdown =
    isFocused &&
    hasToken &&
    (results.length > 0 || isLoading || (error && value.trim().length > 0));

  const handleSelect = (feature: MapboxFeature) => {
    onSelect(feature);
    setIsFocused(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === "Escape") setIsFocused(false);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) =>
          i < results.length - 1 ? i + 1 : i
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsFocused(false);
        setHighlightedIndex(-1);
        break;
    }
  };


  const handleBlur = () => {
    setTimeout(() => setIsFocused(false), 150);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn("h-10", className)}
        aria-autocomplete="list"
        aria-controls={showDropdown ? "location-suggestions" : undefined}
        aria-activedescendant={
          highlightedIndex >= 0
            ? `location-suggestion-${highlightedIndex}`
            : undefined
        }
      />
      {showDropdown && (
        <ul
          id="location-suggestions"
          ref={listRef}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg"
        >
          {isLoading && (
            <li
              className="px-3 py-2 text-sm text-muted-foreground"
              role="option"
            >
              {searchingLabel}
            </li>
          )}
          {error && !isLoading && (
            <li
              className="px-3 py-2 text-sm text-destructive"
              role="option"
            >
              {error}
            </li>
          )}
          {!isLoading &&
            !error &&
            results.map((feature, index) => (
              <li
                key={feature.id}
                id={`location-suggestion-${index}`}
                role="option"
                aria-selected={index === highlightedIndex}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm transition-colors",
                  index === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(feature);
                }}
              >
                {feature.fullAddress || feature.placeName}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
