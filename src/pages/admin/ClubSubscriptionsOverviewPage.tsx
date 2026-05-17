import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { differenceInCalendarDays, format } from "date-fns";
import {
  CrownIcon,
  Search01Icon,
  Eye,
  ShieldIcon,
} from "@/icons/figma-icons";
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

function isStatusFilter(value: string): value is StatusFilter {
  return (
    value === "all" ||
    value === "renewal_needed" ||
    value === "subscribed" ||
    value === "trial" ||
    value === "requested" ||
    value === "nothing"
  );
}

function statusLabel(status: ClubSubscriptionStatus): string {
  if (status === "renewal_needed") return "Renewal Needed";
  if (status === "subscribed") return "Subscribed";
  if (status === "trial") return "Trial";
  if (status === "requested") return "Requested";
  return "Nothing";
}

function statusClassName(status: ClubSubscriptionStatus): string {
  if (status === "renewal_needed") return "bg-red-50 text-red-600 ring-1 ring-red-200";
  if (status === "subscribed") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "trial") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  if (status === "requested") return "bg-blue-50 text-blue-600 ring-1 ring-blue-200";
  return "bg-muted text-muted-foreground ring-1 ring-border";
}

function formatExpiryDate(expiresAt: Date | null): string {
  if (!expiresAt) return "—";
  return format(expiresAt, "dd MMM, yyyy");
}

function getDaysLeftDisplay(expiresAt: Date | null) {
  if (!expiresAt) return { daysLabel: "—", daysClass: "text-muted-foreground", expired: false };
  const days = differenceInCalendarDays(expiresAt, new Date());
  if (days < 0) {
    return { daysLabel: `${Math.abs(days)}d ago`, daysClass: "text-red-500", expired: true };
  }
  return { daysLabel: `${days}d left`, daysClass: "text-emerald-600", expired: false };
}

export default function ClubSubscriptionsOverviewPage() {
  const hasAccess = useHasRoleOrAbove(ROLES.SUPER_ADMIN);
  const { isAuthenticated, isProfileComplete, loading } = useAuth();
  const { data, isLoading } = useClubSubscriptionsOverview(hasAccess);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(isStatusFilter(value) ? value : "all");
  };

  const rows = data?.clubs ?? [];
  const normalized = query.trim().toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesName = normalized.length === 0 || row.name.toLowerCase().includes(normalized);
    const matchesStatus = statusFilter === "all" || row.subscription.status === statusFilter;
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
      <div className="mx-auto w-full min-w-0 max-w-[430px] p-3 md:max-w-5xl md:p-6">

        {/* ── Page header ── */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[22px] font-bold leading-tight tracking-[-0.3px] text-foreground">
              Subscription Management
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {filteredRows.length} club{filteredRows.length !== 1 ? "s" : ""} shown
            </p>
          </div>

          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="relative min-w-0 flex-1 md:w-[240px] md:flex-none">
              <Search01Icon
                size={13}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clubs…"
                className="h-8 pl-8 text-xs md:h-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="renewal_needed">Renewal Needed</SelectItem>
                <SelectItem value="subscribed">Subscribed</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="nothing">Nothing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="overflow-hidden rounded-xl border border-tableBorder bg-card shadow-table">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <InlineLoader />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No clubs match the current filters.
            </div>
          ) : (
            <>
              {/* ── Mobile cards ── */}
              <div className="space-y-2 p-3 lg:hidden">
                {filteredRows.map((row) => {
                  const isPremium = row.subscription.plan === "premium";
                  const { daysLabel, daysClass, expired } = getDaysLeftDisplay(row.subscription.expiresAt);

                  return (
                    <article key={row.id} className="rounded-[10px] border border-border bg-background px-3.5 py-3">
                      <div className="mb-3 flex items-center gap-2.5">
                        <span className="size-9 rounded-[7px] bg-muted" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h2 className="truncate text-[14px] font-semibold text-foreground">{row.name}</h2>
                            {isPremium && <CrownIcon size={14} className="shrink-0 text-amber-500" aria-hidden />}
                          </div>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {row.members} member{row.members !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium", statusClassName(row.subscription.status))}>
                          {statusLabel(row.subscription.status)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-[12px] text-muted-foreground">
                          {formatExpiryDate(row.subscription.expiresAt)}
                          {" · "}
                          <span className={cn("font-medium", daysClass)}>
                            {expired ? "Expired " : ""}{daysLabel}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" asChild className="h-7 gap-1 px-2.5 text-[12px]">
                            <Link to={`/admin/clubs-subscriptions/${row.id}`}>
                              <Eye className="size-3" aria-hidden />
                              View
                            </Link>
                          </Button>
                          {row.subscription.status === "trial" && (
                            <Button size="sm" asChild className="h-7 gap-1 bg-red-500 px-2.5 text-[12px] text-white hover:bg-red-600">
                              <Link to={`/admin/clubs-subscriptions/${row.id}`}>
                                <ShieldIcon className="size-3" aria-hidden />
                                Revoke
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* ── Desktop table ── */}
              <Table
                containerClassName="overflow-x-hidden"
                className="hidden table-fixed lg:table"
              >
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[8%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Club</TableHead>
                    <TableHead className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Members</TableHead>
                    <TableHead className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Plan</TableHead>
                    <TableHead className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    <TableHead className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Expiry</TableHead>
                    <TableHead className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    const isPremium = row.subscription.plan === "premium";
                    const { daysLabel, daysClass, expired } = getDaysLeftDisplay(row.subscription.expiresAt);

                    return (
                      <TableRow key={row.id} className="border-b border-border/60 bg-card transition-colors hover:bg-muted/20">
                        {/* Club name */}
                        <TableCell className="px-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="size-6 shrink-0 rounded-[6px] bg-muted" aria-hidden />
                            <span className="flex min-w-0 items-center gap-1">
                              {isPremium && (
                                <CrownIcon size={13} className="shrink-0 text-amber-500" aria-hidden />
                              )}
                              <span
                                className="truncate text-[13px] font-medium text-foreground"
                                title={row.name}
                              >
                                {row.name}
                              </span>
                            </span>
                          </div>
                        </TableCell>

                        {/* Members */}
                        <TableCell className="px-2 py-2.5 text-center text-[13px] tabular-nums text-foreground/80">
                          {row.members}
                        </TableCell>

                        {/* Plan badge */}
                        <TableCell className="px-2 py-2.5">
                          <span className={cn(
                            "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            isPremium
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                              : "bg-muted text-muted-foreground ring-1 ring-border"
                          )}>
                            {isPremium ? "Premium" : "Free"}
                          </span>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="px-2 py-2.5">
                          <span className={cn(
                            "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold",
                            statusClassName(row.subscription.status)
                          )}>
                            {statusLabel(row.subscription.status)}
                          </span>
                        </TableCell>

                        {/* Expiry + days left stacked */}
                        <TableCell className="px-2 py-2.5">
                          <div className="flex flex-col gap-0.5 leading-tight">
                            <span className="text-[12px] text-foreground/80">
                              {formatExpiryDate(row.subscription.expiresAt)}
                            </span>
                            {row.subscription.expiresAt && (
                              <span className={cn("text-[11px] font-medium", daysClass)}>
                                {expired ? "Expired " : ""}
                                {daysLabel}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-2 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="size-7 text-muted-foreground hover:text-foreground"
                            >
                              <Link
                                to={`/admin/clubs-subscriptions/${row.id}`}
                                aria-label={`View ${row.name}`}
                              >
                                <Eye className="size-3.5" aria-hidden />
                              </Link>
                            </Button>
                            {row.subscription.status === "trial" && (
                              <Button
                                size="icon"
                                asChild
                                className="size-7 bg-red-50 text-red-600 shadow-none hover:bg-red-100 hover:text-red-700"
                              >
                                <Link
                                  to={`/admin/clubs-subscriptions/${row.id}`}
                                  aria-label={`Revoke trial for ${row.name}`}
                                >
                                  <ShieldIcon className="size-3.5" aria-hidden />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
