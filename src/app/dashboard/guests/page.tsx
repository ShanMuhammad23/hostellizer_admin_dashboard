"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, LogIn, LogOut, XCircle, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import MegaLoader from "@/components/ui/MegaLoader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

type GuestRow = {
  id: number;
  studentId: number;
  studentName: string;
  roomNumber: number | null;
  guestName: string;
  guestPhone: string | null;
  guestCnic: string | null;
  relationship: string | null;
  visitStart: string;
  visitEnd: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: string;
  notes: string | null;
};

type StudentOption = { id: number; name: string; roomnumber?: number };

type Filter = "all" | "active" | "today" | "upcoming" | "past";

const STATUS_STYLES: Record<string, string> = {
  checked_in: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-blue-100 text-blue-800",
  checked_out: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-800",
};

function fmtDate(d: string) {
  try {
    return format(parseISO(d.includes("T") ? d : `${d}T12:00:00`), "MMM d, yyyy");
  } catch {
    return d;
  }
}

function fmtDateTime(d: string | null) {
  if (!d) return "—";
  try {
    return format(parseISO(d), "MMM d, h:mm a");
  } catch {
    return d;
  }
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [counts, setCounts] = useState({ active: 0, due_today: 0, upcoming: 0 });
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    guestName: "",
    guestPhone: "",
    guestCnic: "",
    relationship: "",
    visitStart: new Date().toISOString().slice(0, 10),
    visitEnd: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [guestRes, studentRes] = await Promise.all([
        fetch(`/api/guests?filter=${filter}`),
        fetch("/api/students"),
      ]);
      const guestData = await guestRes.json();
      const studentData = await studentRes.json();
      if (!guestData.success) throw new Error(guestData.message);
      setGuests(guestData.guests ?? []);
      setCounts(guestData.counts ?? { active: 0, due_today: 0, upcoming: 0 });
      if (studentData.success) {
        setStudents(
          (studentData.students ?? []).filter(
            (s: { status?: string }) => s.status === "active"
          )
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentId || !form.guestName.trim()) {
      toast.error("Select a host student and enter guest name");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: Number(form.studentId),
          guestName: form.guestName.trim(),
          guestPhone: form.guestPhone.trim() || undefined,
          guestCnic: form.guestCnic.trim() || undefined,
          relationship: form.relationship.trim() || undefined,
          visitStart: form.visitStart,
          visitEnd: form.visitEnd,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Guest registered");
      setOpen(false);
      setForm({
        studentId: "",
        guestName: "",
        guestPhone: "",
        guestCnic: "",
        relationship: "",
        visitStart: new Date().toISOString().slice(0, 10),
        visitEnd: new Date().toISOString().slice(0, 10),
        notes: "",
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to register guest");
    } finally {
      setSaving(false);
    }
  }

  async function guestAction(id: number, action: "check_in" | "check_out" | "cancel") {
    try {
      const res = await fetch(`/api/guests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(
        action === "check_in"
          ? "Guest checked in"
          : action === "check_out"
            ? "Guest checked out"
            : "Visit cancelled"
      );
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remove guest record for ${name}?`)) return;
    try {
      const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Guest record removed");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading && guests.length === 0) return <MegaLoader />;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Guest register</h1>
          <p className="text-sm text-muted-foreground">
            Track who is visiting, which student is hosting them, and visit dates.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register guest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register guest visit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Host student *</label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                        {s.roomnumber ? ` · Room ${s.roomnumber}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Guest name *</label>
                <Input
                  value={form.guestName}
                  onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                  placeholder="Full name of visitor"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={form.guestPhone}
                    onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))}
                    placeholder="03xx…"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">CNIC</label>
                  <Input
                    value={form.guestCnic}
                    onChange={(e) => setForm((f) => ({ ...f, guestCnic: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Relationship</label>
                <Input
                  value={form.relationship}
                  onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                  placeholder="e.g. Father, Friend, Cousin"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">From *</label>
                  <Input
                    type="date"
                    value={form.visitStart}
                    onChange={(e) => setForm((f) => ({ ...f, visitStart: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">To *</label>
                  <Input
                    type="date"
                    value={form.visitEnd}
                    onChange={(e) => setForm((f) => ({ ...f, visitEnd: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="ID verified, overnight stay, etc."
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving…" : "Save guest visit"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-xl">
        <div className="rounded-lg border bg-emerald-50/80 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{counts.active}</p>
          <p className="text-xs text-muted-foreground">Checked in now</p>
        </div>
        <div className="rounded-lg border bg-blue-50/80 p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{counts.due_today}</p>
          <p className="text-xs text-muted-foreground">Expected today</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{counts.upcoming}</p>
          <p className="text-xs text-muted-foreground">Upcoming</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">On premises</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Host student</TableHead>
              <TableHead>Visit period</TableHead>
              <TableHead>Check-in / out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No guest visits in this view.
                </TableCell>
              </TableRow>
            ) : (
              guests.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="font-medium">{g.guestName}</div>
                    <div className="text-xs text-muted-foreground">
                      {[g.relationship, g.guestPhone, g.guestCnic]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/students/${g.studentId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {g.studentName}
                    </Link>
                    {g.roomNumber != null && (
                      <div className="text-xs text-muted-foreground">
                        Room {g.roomNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {fmtDate(g.visitStart)} → {fmtDate(g.visitEnd)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <div>In: {fmtDateTime(g.checkInAt)}</div>
                    <div>Out: {fmtDateTime(g.checkOutAt)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={STATUS_STYLES[g.status] ?? ""}
                    >
                      {g.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {g.status === "scheduled" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Check in"
                          onClick={() => guestAction(g.id, "check_in")}
                        >
                          <LogIn className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
                      {g.status === "checked_in" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Check out"
                          onClick={() => guestAction(g.id, "check_out")}
                        >
                          <LogOut className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                      {g.status === "scheduled" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Cancel"
                          onClick={() => guestAction(g.id, "cancel")}
                        >
                          <XCircle className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Delete"
                        onClick={() => handleDelete(g.id, g.guestName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <UserRound className="h-3.5 w-3.5" />
        Security tip: verify CNIC at reception and check guests out when they leave.
      </p>
    </div>
  );
}
