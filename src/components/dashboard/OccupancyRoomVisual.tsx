"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type OccRow = { month: string; students: number; capacity: number };

export function OccupancyRoomVisual() {
  const [rows, setRows] = useState<OccRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/fetchChartData");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.occupancy?.length) throw new Error("No occupancy data");
        if (!cancelled) setRows(data.occupancy);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load occupancy");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }

  if (error || rows.length === 0) {
    return (
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Occupancy & room status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error ?? "No data"}</p>
        </CardContent>
      </Card>
    );
  }

  const latest = rows[rows.length - 1];
  const capacity = Math.max(1, latest.capacity);
  const students = Math.min(latest.students, capacity);
  const pct = Math.round((students / capacity) * 100);
  const cells = Math.min(48, Math.max(12, Math.ceil(capacity / 2)));
  const filled = Math.round((students / capacity) * cells);

  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Occupancy & room status
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Latest month ({latest.month}): {students} / {capacity} beds (
            {pct}%)
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/dashboard/room-attendance">Room attendance</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="grid max-w-full grid-cols-8 gap-1 rounded-lg border bg-muted/30 p-3 sm:grid-cols-10"
        >
          {Array.from({ length: cells }).map((_, i) => (
            <div
              key={i}
              title={i < filled ? "Occupied" : "Vacant"}
              className={`aspect-square rounded-sm border ${
                i < filled
                  ? "border-primary/40 bg-primary/70"
                  : "border-muted bg-background"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Visual grid approximates bed occupancy vs hostel capacity (same basis
          as your occupancy chart). Use room attendance for per-room detail.
        </p>
      </CardContent>
    </Card>
  );
}
