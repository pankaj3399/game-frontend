import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Pagination({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent(
  { className, ...props }: React.ComponentProps<"ul">
) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("list-none", className)}
      {...props}
    />
  )
}

interface PaginationLinkProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

function PaginationLink({
  className,
  isActive,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({
          variant: isActive ? "default" : "outline",
          size: "icon",
        }),
        "h-8 w-8",
        className,
      )}
      {...props}
    />
  )
}

interface PaginationNavButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
}

function PaginationPrevious({
  className,
  disabled,
  ...props
}: PaginationNavButtonProps) {
  return (
    <button
      type="button"
      aria-label="Previous page"
      disabled={disabled}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "h-8 w-8",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
    </button>
  )
}

function PaginationNext({
  className,
  disabled,
  ...props
}: PaginationNavButtonProps) {
  return (
    <button
      type="button"
      aria-label="Next page"
      disabled={disabled}
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "h-8 w-8",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      <ChevronRight className="size-4" aria-hidden="true" />
    </button>
  )
}

function PaginationEllipsis({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-8 w-8 items-center justify-center",
        className,
      )}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}

