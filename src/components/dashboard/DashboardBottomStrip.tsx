"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarClock, Utensils, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Upcoming = { id: string; name: string; due: string };

type Notice = { id: string; title: string; date: string };

export function DashboardBottomStrip() {
  const [messToday, setMessToday] = useState(0);
  const [messDef, setMessDef] = useState(0);
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [snapRes, notRes] = await Promise.all([
          fetch("/api/dashboard/snapshot"),
          fetch("/api/notifications"),
        ]);
        const snap = await snapRes.json();
        const notJson = await notRes.json();
        if (!cancelled && snap.success) {
          setMessToday(snap.messAttendanceToday ?? 0);
          setMessDef(snap.messDefaultersMonth ?? 0);
          setUpcoming(snap.upcomingRent ?? []);
        }
        if (!cancelled && notJson.success && Array.isArray(notJson.notifications)) {
          setNotices(notJson.notifications.slice(0, 4));
        }
      } catch {
        if (!cancelled) {
          setMessToday(0);
          setMessDef(0);
          setUpcoming([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function fmtDue(isoOrDate: string) {
    try {
      const d = isoOrDate.includes("T") ? parseISO(isoOrDate) : parseISO(`${isoOrDate}T12:00:00`);
      return format(d, "MMM d");
    } catch {
      return isoOrDate;
    }
  }

  return (
    <section
      aria-label="Mess and attendance snapshot"
      className="space-y-3 rounded-lg border border-border bg-muted/20 p-3"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Mess, attendance & rent snapshot
      </h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s mess marks</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{messToday}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Distinct students with mess attendance recorded for today.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/room-attendance">Open attendance</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mess billing alerts</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{messDef}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Mess enrollees with overdue or unpaid rent past due date.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/students">Review students</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming rent due</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dues in the next 14 days.</p>
            ) : (
              <ul className="max-h-36 space-y-1.5 overflow-y-auto text-sm">
                {upcoming.map((u) => (
                  <li key={u.id} className="flex justify-between gap-2 border-b border-border/60 py-1 last:border-0">
                    <Link
                      href={`/dashboard/students/${u.id}`}
                      className="truncate font-medium text-primary hover:underline"
                    >
                      {u.name}
                    </Link>
                    <span className="shrink-0 text-muted-foreground">{fmtDue(u.due)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent notices</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices yet.</p>
            ) : (
              <ul className="max-h-36 space-y-1.5 overflow-y-auto text-sm">
                {notices.map((n) => (
                  <li key={n.id} className="border-b border-border/60 py-1 last:border-0">
                    <span className="font-medium line-clamp-1">{n.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {n.date ? format(parseISO(n.date), "MMM d, yyyy") : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
