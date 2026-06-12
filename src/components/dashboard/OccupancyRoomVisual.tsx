"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DoorOpen, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudentInRoom = {
  id: number | string;
  name: string;
  accomodationtype?: string;
};

type RoomCell = {
  key: string;
  roomNumber: number | null;
  occupants: number;
  capacity: number;
  status: "vacant" | "partial" | "full";
  students: StudentInRoom[];
};

function capacityForRoom(students: StudentInRoom[]): number {
  if (students.some((s) => s.accomodationtype === "single")) return 1;
  if (students.some((s) => s.accomodationtype === "triple")) return 3;
  return 2;
}

function statusForRoom(occupants: number, capacity: number): RoomCell["status"] {
  if (occupants <= 0) return "vacant";
  if (occupants >= capacity) return "full";
  return "partial";
}

export function OccupancyRoomVisual() {
  const [totalRooms, setTotalRooms] = useState(0);
  const [rooms, setRooms] = useState<RoomCell[]>([]);
  const [unassigned, setUnassigned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [overviewRes, byRoomRes] = await Promise.all([
          fetch("/api/fetchOverviewData"),
          fetch("/api/students/by-room"),
        ]);

        if (!overviewRes.ok) throw new Error(`Overview HTTP ${overviewRes.status}`);
        if (!byRoomRes.ok) throw new Error(`Rooms HTTP ${byRoomRes.status}`);

        const overviewJson = await overviewRes.json();
        const byRoomJson = await byRoomRes.json();

        if (!overviewJson.success || !overviewJson.overviewData?.[0]) {
          throw new Error("No overview data");
        }
        if (!byRoomJson.success) {
          throw new Error(byRoomJson.message ?? "Failed to load rooms");
        }

        const overview = overviewJson.overviewData[0];
        const total = Math.max(0, Number(overview.total_rooms) || 0);
        const byRoom = (byRoomJson.studentsByRoom ?? {}) as Record<
          string,
          StudentInRoom[]
        >;

        const occupied: RoomCell[] = Object.entries(byRoom)
          .filter(([key]) => key !== "null" && key !== "undefined" && key !== "")
          .map(([key, students]) => {
            const list = Array.isArray(students) ? students : [];
            const roomNumber = Number(key);
            const capacity = capacityForRoom(list);
            const occupants = list.length;
            return {
              key: `room-${key}`,
              roomNumber: Number.isFinite(roomNumber) ? roomNumber : null,
              occupants,
              capacity,
              status: statusForRoom(occupants, capacity),
              students: list,
            };
          })
          .sort((a, b) => (a.roomNumber ?? 0) - (b.roomNumber ?? 0));

        const unassignedStudents = byRoom["null"]?.length ?? byRoom.null?.length ?? 0;
        const vacantSlots = Math.max(0, total - occupied.length);

        const vacant: RoomCell[] = Array.from({ length: vacantSlots }, (_, i) => ({
          key: `vacant-${i}`,
          roomNumber: null,
          occupants: 0,
          capacity: 2,
          status: "vacant" as const,
          students: [],
        }));

        if (!cancelled) {
          setTotalRooms(total);
          setRooms([...occupied, ...vacant]);
          setUnassigned(unassignedStudents);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load room grid");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const occupiedRooms = rooms.filter((r) => r.status !== "vacant").length;
    const full = rooms.filter((r) => r.status === "full").length;
    const partial = rooms.filter((r) => r.status === "partial").length;
    const vacant = rooms.filter((r) => r.status === "vacant").length;
    const studentsInGrid = rooms.reduce((n, r) => n + r.occupants, 0);
    const pct =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    return { occupiedRooms, full, partial, vacant, studentsInGrid, pct };
  }, [rooms, totalRooms]);

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

  if (error) {
    return (
      <Card className="border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Occupancy & room status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card shadow-sm">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            Occupancy & room status
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {stats.occupiedRooms} of {totalRooms} rooms in use ({stats.pct}%) ·{" "}
            {stats.studentsInGrid} students assigned
            {unassigned > 0 ? ` · ${unassigned} unassigned` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/dashboard/room-attendance">Room attendance</Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-primary/40 bg-primary/80" />
            Full
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-amber-400/60 bg-amber-400/50" />
            Partial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-dashed border-muted-foreground/40 bg-muted/40" />
            Vacant
          </span>
        </div>

        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rooms configured. Set total rooms in your hostel profile.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 max-h-[320px] overflow-y-auto pr-1">
            {rooms.map((room) => (
              <div
                key={room.key}
                title={
                  room.status === "vacant"
                    ? "Vacant room"
                    : room.students.map((s) => s.name).join(", ")
                }
                className={cn(
                  "flex min-h-[88px] flex-col justify-between rounded-lg border p-2.5 transition-colors",
                  room.status === "full" &&
                    "border-primary/50 bg-primary/15 shadow-sm",
                  room.status === "partial" &&
                    "border-amber-400/50 bg-amber-50 dark:bg-amber-950/20",
                  room.status === "vacant" &&
                    "border-dashed border-muted-foreground/30 bg-muted/20"
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                    <DoorOpen className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    {room.status === "vacant" ? (
                      <span className="text-muted-foreground">Vacant</span>
                    ) : (
                      <span>Room {room.roomNumber}</span>
                    )}
                  </div>
                  {room.status !== "vacant" && (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        room.status === "full" && "bg-primary/20 text-primary",
                        room.status === "partial" && "bg-amber-200/80 text-amber-900"
                      )}
                    >
                      {room.status}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {room.occupants}/{room.capacity}
                  </span>
                  {room.status !== "vacant" && (
                    <span className="truncate pl-1 text-right text-[10px]">
                      {room.students[0]?.name?.split(" ")[0]}
                      {room.occupants > 1 ? ` +${room.occupants - 1}` : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/20 p-2 text-center text-xs">
          <div>
            <p className="text-lg font-bold text-primary">{stats.full}</p>
            <p className="text-muted-foreground">Full rooms</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{stats.partial}</p>
            <p className="text-muted-foreground">Partial</p>
          </div>
          <div>
            <p className="text-lg font-bold text-muted-foreground">{stats.vacant}</p>
            <p className="text-muted-foreground">Vacant</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
