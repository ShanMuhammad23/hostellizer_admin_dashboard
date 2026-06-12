"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  UserPlus,
  Receipt,
  ClipboardList,
  UserCheck,
  UserRound,
  BadgeCheck,
  MessageCircle,
  Star,
  UserCircle,
  ArrowRight,
  AlertTriangle,
  UtensilsCrossed,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudentHit = {
  id: string | number;
  name: string;
  email: string;
  roomnumber?: number;
};

const QUICK_LINKS = [
  { label: "Students", href: "/dashboard/students", icon: Users },
  { label: "Add", href: "/dashboard/students?action=add", icon: UserPlus },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { label: "Applications", href: "/dashboard/applications", icon: ClipboardList },
  { label: "Guests", href: "/dashboard/guests", icon: UserRound },
  { label: "Attendance", href: "/dashboard/room-attendance", icon: UserCheck },
  { label: "Staff", href: "/dashboard/staff", icon: BadgeCheck },
  { label: "Chats", href: "/dashboard/chats", icon: MessageCircle },
  { label: "Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
] as const;

export function DashboardAlertsAndQuickActions() {
  const router = useRouter();
  const [overdueRent, setOverdueRent] = useState(0);
  const [pendingApps, setPendingApps] = useState(0);
  const [messDef, setMessDef] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/alerts");
        const data = await res.json();
        if (!cancelled && data.success) {
          setOverdueRent(data.overdueRent ?? 0);
          setPendingApps(data.pendingApplications ?? 0);
          setMessDef(data.messDefaulters ?? 0);
        }
      } catch {
        if (!cancelled) {
          setOverdueRent(0);
          setPendingApps(0);
          setMessDef(0);
        }
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setHits([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (!data.success || !Array.isArray(data.students)) {
        setHits([]);
        return;
      }
      const lower = trimmed.toLowerCase();
      setHits(
        (data.students as StudentHit[])
          .filter(
            (s) =>
              s.name?.toLowerCase().includes(lower) ||
              s.email?.toLowerCase().includes(lower) ||
              String(s.roomnumber ?? "").includes(trimmed)
          )
          .slice(0, 5)
      );
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  function goToStudentsSearch() {
    const q = query.trim();
    router.push(
      q ? `/dashboard/students?search=${encodeURIComponent(q)}` : "/dashboard/students"
    );
    setOpen(false);
  }

  const alerts = [
    {
      key: "rent",
      label: "Overdue rent",
      value: overdueRent,
      href: "/dashboard/students",
      icon: AlertTriangle,
      tone: overdueRent > 0 ? "text-amber-900" : "text-muted-foreground",
      bg: overdueRent > 0 ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border",
    },
    {
      key: "apps",
      label: "Pending apps",
      value: pendingApps,
      href: "/dashboard/applications",
      icon: ClipboardList,
      tone: pendingApps > 0 ? "text-primary" : "text-muted-foreground",
      bg: pendingApps > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border",
    },
    {
      key: "mess",
      label: "Mess defaulters",
      value: messDef,
      href: "/dashboard/students",
      icon: UtensilsCrossed,
      tone: messDef > 0 ? "text-red-800" : "text-muted-foreground",
      bg: messDef > 0 ? "bg-red-50 border-red-200" : "bg-muted/30 border-border",
    },
  ];

  return (
    <section
      aria-label="Critical alerts and quick actions"
      className="rounded-lg border border-border bg-card shadow-sm overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x divide-border">
        {/* Alerts — left */}
        <div className="lg:col-span-4 p-3 md:p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Critical alerts
          </h2>
          <div className="flex flex-col gap-1.5">
            {alerts.map((it) => (
              <Link
                key={it.key}
                href={it.href}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 transition hover:opacity-95",
                  it.bg
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <it.icon className={cn("h-3.5 w-3.5 shrink-0", it.tone)} />
                  <span className="truncate text-xs font-medium">{it.label}</span>
                </div>
                <span className={cn("text-base font-bold tabular-nums", it.tone)}>
                  {alertsLoading ? "—" : it.value}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick actions — right */}
        <div className="lg:col-span-8 p-3 md:p-4 border-t lg:border-t-0 border-border">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Quick actions
          </h2>

          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  goToStudentsSearch();
                }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Search students…"
              className="h-9 pl-8 pr-20 text-sm"
            />
            <Button
              type="button"
              size="sm"
              className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2.5 text-xs"
              onClick={goToStudentsSearch}
            >
              Search
            </Button>

            {open && query.trim().length >= 2 && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                {searching ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>
                ) : hits.length === 0 ? (
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-xs hover:bg-muted"
                    onClick={goToStudentsSearch}
                  >
                    View all for &ldquo;{query.trim()}&rdquo;
                  </button>
                ) : (
                  <ul className="max-h-40 overflow-y-auto py-1">
                    {hits.map((s) => (
                      <li key={String(s.id)}>
                        <Link
                          href={`/dashboard/students/${s.id}`}
                          className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-muted"
                          onClick={() => setOpen(false)}
                        >
                          <span className="truncate font-medium">{s.name}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {s.roomnumber ? `Rm ${s.roomnumber}` : s.email}
                          </span>
                        </Link>
                      </li>
                    ))}
                    <li className="border-t">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-primary hover:bg-muted"
                        onClick={goToStudentsSearch}
                      >
                        View all
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/30 px-2 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <link.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
