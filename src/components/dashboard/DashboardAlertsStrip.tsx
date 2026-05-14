"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardList, UtensilsCrossed } from "lucide-react";

export function DashboardAlertsStrip() {
  const [overdueRent, setOverdueRent] = useState(0);
  const [pendingApps, setPendingApps] = useState(0);
  const [messDef, setMessDef] = useState(0);
  const [loading, setLoading] = useState(true);

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
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    {
      key: "rent",
      label: "Overdue rent",
      value: overdueRent,
      href: "/dashboard/students",
      icon: AlertTriangle,
      tone: overdueRent > 0 ? "text-amber-900" : "text-muted-foreground",
      bg: overdueRent > 0 ? "bg-amber-50 border-amber-200" : "bg-muted/40 border-border",
    },
    {
      key: "apps",
      label: "Pending applications",
      value: pendingApps,
      href: "/dashboard/applications",
      icon: ClipboardList,
      tone: pendingApps > 0 ? "text-primary" : "text-muted-foreground",
      bg: pendingApps > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-border",
    },
    {
      key: "mess",
      label: "Mess defaulters",
      value: messDef,
      href: "/dashboard/students",
      icon: UtensilsCrossed,
      tone: messDef > 0 ? "text-red-800" : "text-muted-foreground",
      bg: messDef > 0 ? "bg-red-50 border-red-200" : "bg-muted/40 border-border",
    },
  ];

  return (
    <section
      aria-label="Critical alerts and quick actions"
      className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Critical alerts & quick actions
        </h2>
        {loading ? (
          <span className="text-[10px] text-muted-foreground">Loading…</span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.key}
            href={it.href}
            className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 transition hover:opacity-95 ${it.bg}`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <it.icon className={`h-4 w-4 shrink-0 ${it.tone}`} />
              <span className="truncate text-sm font-medium">{it.label}</span>
            </div>
            <span className={`text-lg font-bold tabular-nums ${it.tone}`}>
              {loading ? "—" : it.value}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
