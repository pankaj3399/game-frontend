import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface SwitchToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
  switchClassName?: string;
  id?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export function SwitchToggle({
  checked,
  onCheckedChange,
  children,
  className,
  switchClassName,
  id: idProp,
  disabled,
  name,
  required,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: SwitchToggleProps) {
  const generatedId = React.useId();
  const switchId = idProp ?? generatedId;

  return (
    <label
      htmlFor={switchId}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium text-[#374151]",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <span>{children}</span>
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        name={name}
        required={required}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "data-[state=checked]:bg-[#16a34a] data-[state=unchecked]:bg-[#d1d5db]",
          switchClassName,
        )}
      />
    </label>
  );
}
