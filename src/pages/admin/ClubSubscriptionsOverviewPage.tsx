import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { differenceInCalendarDays, format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CrownIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useAuth, useHasRoleOrAbove } from "@/pages/auth/hooks";
import { ROLES } from "@/constants/roles";
import { useClubSubscriptionsOverview } from "@/pages/admin/hooks/useClubSubscriptionsOverview";
import InlineLoader from "@/components/shared/InlineLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ClubSubscriptionStatus } from "@/pages/admin/hooks/useClubSubscriptionsOverview";

type StatusFilter = "all" | ClubSubscriptionStatus;

function statusLabel(status: ClubSubscriptionStatus): string {
  if (status === "renewal_needed") return "Renewal Needed";
  if (status === "subscribed") return "Subscribed";
  if (status === "requested") return "Requested";
  return "Nothing";
}

function statusClassName(status: ClubSubscriptionStatus): string {
  if (status === "renewal_needed") {
    return "bg-destructive/12 text-destructive";
  }
  if (status === "subscribed") {
    return "bg-brand-primary/12 text-brand-primary";
  }
  if (status === "requested") {
    return "bg-blue-500/12 text-blue-600";
  }
  return "bg-muted text-muted-foreground";
}

function formatExpiryDate(expiresAt: Date | null): string {
  if (!expiresAt) return "-";
  return format(expiresAt, "dd MMM, yyyy");
}

function daysLeftLabel(expiresAt: Date | null): string {
  if (!expiresAt) return "-";
  const days = differenceInCalendarDays(expiresAt, new Date());
  if (days < 0) {
    return `Expired ${Math.abs(days)}d ago`;
  }
  return `${days}d`;
}

function getDaysLeftDisplay(expiresAt: Date | null) {
  const daysLabel = daysLeftLabel(expiresAt);

  const daysClass =
    daysLabel.startsWith("Expired")
      ? "text-red-600"
      : daysLabel === "-"
        ? "text-muted-foreground"
        : "text-emerald-700";
  return { daysLabel, daysClass };
}

export default function ClubSubscriptionsOverviewPage() {
  const hasAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const { data, isLoading } = useClubSubscriptionsOverview(hasAccess);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const rows = data?.clubs ?? [];

  const normalized = query.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesName =
      normalized.length === 0 || row.name.toLowerCase().includes(normalized);
    const matchesStatus =
      statusFilter === "all" || row.subscription.status === statusFilter;

    return matchesName && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <InlineLoader />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/information" replace />;
  if (!hasAccess) return <Navigate to="/profile" replace />;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-brand-primary/[0.03]">
      <div className="mx-auto w-full max-w-[430px] p-3 md:max-w-6xl md:p-6">
        <div className="overflow-hidden rounded-xl border border-tableBorder bg-card shadow-table">
          <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <h1 className="text-lg font-semibold text-foreground md:text-3xl">Subscription Management</h1>
            <div className="flex w-full items-center gap-2 md:w-auto md:gap-3">
              <div className="relative min-w-0 flex-1 md:w-[280px] md:flex-none">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search clubs..."
                  className="h-8 pl-9 text-xs md:h-9 md:text-sm"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger className="h-8 w-[122px] text-xs md:h-9 md:w-[155px] md:text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="renewal_needed">Renewal Needed</SelectItem>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="nothing">Nothing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <InlineLoader />
            </div>
          ) : (
            <>
              {filteredRows.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground md:px-6">
                  No clubs match current filters.
                </div>
              ) : (
                <>
                  <div className="space-y-3 p-4 md:hidden">
                    {filteredRows.map((row) => {
                      const isPremium = row.subscription.plan === "premium";
                      const { daysLabel, daysClass } = getDaysLeftDisplay(row.subscription.expiresAt);

                      return (
                        <article key={row.id} className="rounded-[10px] bg-foreground/[0.04] px-3.5 py-3.5">
                          <div className="mb-4 flex items-center gap-3">
                            <span className="size-[45px] rounded-[7px] bg-muted" aria-hidden />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h2 className="truncate text-base font-medium text-foreground">{row.name}</h2>
                                {isPremium && (
                                  <HugeiconsIcon icon={CrownIcon} size={16} className="shrink-0 text-amber-500" aria-hidden />
                                )}
                              </div>
                              <p className="mt-1 text-[13px] text-foreground/65">
                                Expiry Date: <span className="text-foreground">{formatExpiryDate(row.subscription.expiresAt)}</span>
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-[14px]">
                              <span className="text-foreground/75">Members</span>
                              <span className="font-medium text-foreground">{row.members}</span>
                            </div>
                            <div className="flex items-center justify-between text-[14px]">
                              <span className="text-foreground/75">Subscription</span>
                              <span
                                className={cn(
                                  "inline-flex h-7 items-center rounded-[5px] px-2 text-[13px] font-medium",
                                  isPremium
                                    ? "bg-brand-accent/20 text-amber-700"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {isPremium ? "Premium" : "Free"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[14px]">
                              <span className="text-foreground/75">Status</span>
                              <span
                                className={cn(
                                  "inline-flex h-7 items-center rounded-[5px] px-2 text-[13px] font-medium",
                                  statusClassName(row.subscription.status)
                                )}
                              >
                                {statusLabel(row.subscription.status)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[14px]">
                              <span className="text-foreground/75">Days Left</span>
                              <span className={cn("font-medium", daysClass)}>{daysLabel}</span>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="mt-4 h-8 w-full gap-2 border-foreground bg-transparent text-[14px] font-medium text-foreground hover:bg-transparent"
                          >
                            <Link to={`/admin/clubs-subscriptions/${row.id}`}>View</Link>
                          </Button>
                        </article>
                      );
                    })}
                  </div>

                  <Table className="hidden min-w-full md:table">
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Club Name</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Members</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Subscription</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Expiry Date</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Days Left</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((row) => {
                        const isPremium = row.subscription.plan === "premium";
                        const { daysLabel, daysClass } = getDaysLeftDisplay(row.subscription.expiresAt);

                        return (
                          <TableRow key={row.id} className="bg-card hover:bg-muted/20">
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="size-[18px] rounded-full bg-muted" aria-hidden />
                                <span className="flex items-center gap-1 text-sm font-medium text-foreground">
                                  {row.name}
                                  {isPremium && (
                                    <HugeiconsIcon icon={CrownIcon} size={16} className="text-amber-500" aria-hidden />
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-foreground">{row.members}</TableCell>
                            <TableCell className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium",
                                  isPremium
                                    ? "bg-brand-accent/20 text-amber-800"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {isPremium ? "Premium" : "Free"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium",
                                  statusClassName(row.subscription.status)
                                )}
                              >
                                {statusLabel(row.subscription.status)}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-foreground">
                              {formatExpiryDate(row.subscription.expiresAt)}
                            </TableCell>
                            <TableCell className={cn("px-4 py-3 text-sm", daysClass)}>
                              {daysLabel}
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Button variant="ghost" size="sm" asChild className="h-8 gap-1 px-2">
                                <Link to={`/admin/clubs-subscriptions/${row.id}`}>View</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}