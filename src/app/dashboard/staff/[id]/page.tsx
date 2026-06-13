"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { StaffForm } from "@/components/staff/StaffForm";
import { getUploadServeUrl } from "@/lib/upload-url";
import MegaLoader from "@/components/ui/MegaLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type StaffRecord = Record<string, unknown>;

type AdvanceEntry = {
  id: number;
  entryType: string;
  amount: string | number;
  occurredOn: string;
  reference: string | null;
  notes: string | null;
};

type LeaveRow = {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  isPaid: boolean;
  status: string;
  notes: string | null;
};

type AttRow = {
  id: number;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  lateMinutes: number;
  overtimeMinutes: number;
  notes: string | null;
};

type PayrollPeriod = {
  id: number;
  year: number;
  month: number;
  status: string;
  notes: string | null;
  entryCount?: number;
};

type PayrollEntry = {
  id: number;
  staffId: number;
  fullName: string;
  baseSalary: string | number;
  overtimeAmount: string | number;
  holidayDutyAmount: string | number;
  eidBonusAmount: string | number;
  messAllowanceAmount: string | number;
  advanceDeductionAmount: string | number;
  absenceDeductionAmount: string | number;
  damageChargeAmount: string | number;
  grossEarnings: string | number;
  totalDeductions: string | number;
  netPayable: string | number;
};

function monthStartEnd(y: number, m: number) {
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}

export default function StaffDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");

  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [advances, setAdvances] = useState<AdvanceEntry[]>([]);
  const [outstanding, setOutstanding] = useState(0);
  const [advForm, setAdvForm] = useState({
    entryType: "advance",
    amount: "",
    occurredOn: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

  const [leaves, setLeaves] = useState<LeaveRow[]>([]);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "casual",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    daysCount: "1",
    isPaid: false,
    notes: "",
  });

  const now = new Date();
  const [attMonth, setAttMonth] = useState(now.getMonth() + 1);
  const [attYear, setAttYear] = useState(now.getFullYear());
  const [attendance, setAttendance] = useState<AttRow[]>([]);
  const [attForm, setAttForm] = useState({
    attendanceDate: new Date().toISOString().slice(0, 10),
    status: "present",
    checkIn: "",
    checkOut: "",
    lateMinutes: "0",
    overtimeMinutes: "0",
    notes: "",
  });

  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [periodDetail, setPeriodDetail] = useState<{
    period: PayrollPeriod;
    entries: PayrollEntry[];
  } | null>(null);
  const [newPeriodYear, setNewPeriodYear] = useState(now.getFullYear());
  const [newPeriodMonth, setNewPeriodMonth] = useState(now.getMonth() + 1);
  const [periodNotes, setPeriodNotes] = useState("");
  const [payrollForm, setPayrollForm] = useState({
    baseSalary: "",
    overtimeAmount: "0",
    holidayDutyAmount: "0",
    eidBonusAmount: "0",
    messAllowanceAmount: "0",
    advanceDeductionAmount: "0",
    absenceDeductionAmount: "0",
    damageChargeAmount: "0",
  });

  const loadStaff = useCallback(async () => {
    const res = await fetch(`/api/staff/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    setStaff(data.staff);
  }, [id]);

  const loadAdvances = useCallback(async () => {
    const res = await fetch(`/api/staff/${id}/advances`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    setAdvances(data.entries || []);
    setOutstanding(Number(data.outstandingAdvance ?? 0));
  }, [id]);

  const loadLeaves = useCallback(async () => {
    const res = await fetch(`/api/staff/${id}/leave`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    setLeaves(data.leaves || []);
  }, [id]);

  const loadAttendance = useCallback(async () => {
    const { from, to } = monthStartEnd(attYear, attMonth);
    const res = await fetch(
      `/api/staff/${id}/attendance?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    setAttendance(data.attendance || []);
  }, [id, attYear, attMonth]);

  const loadPeriods = useCallback(async () => {
    const res = await fetch("/api/staff/payroll");
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    setPeriods(data.periods || []);
  }, []);

  const loadPeriodDetail = useCallback(async (periodId: string) => {
    if (!periodId) {
      setPeriodDetail(null);
      return;
    }
    const res = await fetch(`/api/staff/payroll/${periodId}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    setPeriodDetail({ period: data.period, entries: data.entries || [] });
    setPeriodNotes(String(data.period?.notes ?? ""));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadStaff();
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Failed to load staff");
          setStaff(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStaff]);

  useEffect(() => {
    loadPeriods().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Failed to load payroll periods")
    );
  }, [loadPeriods]);

  useEffect(() => {
    if (selectedPeriodId) {
      loadPeriodDetail(selectedPeriodId).catch((e) =>
        toast.error(e instanceof Error ? e.message : "Failed to load period")
      );
    } else {
      setPeriodDetail(null);
    }
  }, [selectedPeriodId, loadPeriodDetail]);

  useEffect(() => {
    loadAttendance().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Failed to load attendance")
    );
  }, [loadAttendance]);

  const salaryDefault = useMemo(() => {
    if (!staff) return "";
    return String(Number(staff.salaryAmountMonthly ?? 0));
  }, [staff]);

  useEffect(() => {
    if (periodDetail && staff) {
      const mine = periodDetail.entries.find(
        (e) => Number(e.staffId) === Number(staff.id)
      );
      if (mine) {
        setPayrollForm({
          baseSalary: String(mine.baseSalary),
          overtimeAmount: String(mine.overtimeAmount),
          holidayDutyAmount: String(mine.holidayDutyAmount),
          eidBonusAmount: String(mine.eidBonusAmount),
          messAllowanceAmount: String(mine.messAllowanceAmount),
          advanceDeductionAmount: String(mine.advanceDeductionAmount),
          absenceDeductionAmount: String(mine.absenceDeductionAmount),
          damageChargeAmount: String(mine.damageChargeAmount),
        });
      } else {
        setPayrollForm({
          baseSalary: salaryDefault || "0",
          overtimeAmount: "0",
          holidayDutyAmount: "0",
          eidBonusAmount: "0",
          messAllowanceAmount: "0",
          advanceDeductionAmount: "0",
          absenceDeductionAmount: "0",
          damageChargeAmount: "0",
        });
      }
    }
  }, [periodDetail, staff, salaryDefault]);

  async function refreshTab(tab: string) {
    try {
      if (tab === "advances") await loadAdvances();
      if (tab === "leave") await loadLeaves();
      if (tab === "attendance") await loadAttendance();
      if (tab === "payroll") {
        await loadPeriods();
        if (selectedPeriodId) await loadPeriodDetail(selectedPeriodId);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Refresh failed");
    }
  }

  if (loading) return <MegaLoader />;
  if (!staff) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Staff not found.</p>
        <Button asChild variant="link" className="px-0">
          <Link href="/dashboard/staff">Back to directory</Link>
        </Button>
      </div>
    );
  }

  const photo = String(staff.photoPath ?? "");
  const fullName = String(staff.fullName ?? "");
  const role = String(staff.role ?? "");
  const status = String(staff.status ?? "active");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/staff" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Staff directory
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
        {photo ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border">
            <Image src={getUploadServeUrl(photo)} alt="" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border bg-muted text-2xl font-semibold text-muted-foreground">
            {fullName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-primary truncate">{fullName}</h1>
          <p className="text-sm text-muted-foreground">
            {role} · CNIC {String(staff.cnic ?? "")}
          </p>
        </div>
        <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
      </div>

      <Tabs
        defaultValue="profile"
        onValueChange={(v) => {
          void refreshTab(v);
        }}
        className="w-full"
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <StaffForm
            mode="edit"
            staffId={id}
            initialStaff={staff}
            onCancel={() => {}}
            onSuccess={async () => {
              toast.success("Profile updated");
              await loadStaff();
            }}
          />
        </TabsContent>

        <TabsContent value="advances" className="mt-4 space-y-6">
          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
            Outstanding advance balance:{" "}
            <span className="font-semibold tabular-nums">
              PKR {outstanding.toLocaleString()}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>Entry type</Label>
              <Select
                value={advForm.entryType}
                onValueChange={(v) => setAdvForm((f) => ({ ...f, entryType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="repayment">Repayment</SelectItem>
                  <SelectItem value="payroll_deduction">Payroll deduction</SelectItem>
                  <SelectItem value="adjustment">Adjustment (+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount (PKR)</Label>
              <Input
                type="number"
                value={advForm.amount}
                onChange={(e) => setAdvForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={advForm.occurredOn}
                onChange={(e) => setAdvForm((f) => ({ ...f, occurredOn: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Reference</Label>
              <Input
                value={advForm.reference}
                onChange={(e) => setAdvForm((f) => ({ ...f, reference: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
              <Label>Notes</Label>
              <Input
                value={advForm.notes}
                onChange={(e) => setAdvForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={async () => {
              try {
                const res = await fetch(`/api/staff/${id}/advances`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    entryType: advForm.entryType,
                    amount: Number(advForm.amount),
                    occurredOn: advForm.occurredOn,
                    reference: advForm.reference || undefined,
                    notes: advForm.notes || undefined,
                  }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);
                toast.success("Ledger entry added");
                await loadAdvances();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            Add entry
          </Button>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No ledger rows yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  advances.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.occurredOn}</TableCell>
                      <TableCell className="capitalize">{a.entryType.replace("_", " ")}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        PKR {Number(a.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {a.reference || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="leave" className="mt-4 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label>Leave type</Label>
              <Select
                value={leaveForm.leaveType}
                onValueChange={(v) => setLeaveForm((f) => ({ ...f, leaveType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start</Label>
              <Input
                type="date"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>End</Label>
              <Input
                type="date"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Days</Label>
              <Input
                type="number"
                min={1}
                value={leaveForm.daysCount}
                onChange={(e) => setLeaveForm((f) => ({ ...f, daysCount: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="lpaid"
                checked={leaveForm.isPaid}
                onCheckedChange={(c) =>
                  setLeaveForm((f) => ({ ...f, isPaid: c === true }))
                }
              />
              <Label htmlFor="lpaid">Paid leave</Label>
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <Label>Notes</Label>
              <Input
                value={leaveForm.notes}
                onChange={(e) => setLeaveForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={async () => {
              try {
                const res = await fetch(`/api/staff/${id}/leave`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    leaveType: leaveForm.leaveType,
                    startDate: leaveForm.startDate,
                    endDate: leaveForm.endDate,
                    daysCount: Number(leaveForm.daysCount) || 1,
                    isPaid: leaveForm.isPaid,
                    notes: leaveForm.notes || undefined,
                  }),
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.message);
                toast.success("Leave request submitted");
                await loadLeaves();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            Submit request
          </Button>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dates</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No leave records.
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">
                        {l.startDate} → {l.endDate}
                      </TableCell>
                      <TableCell className="capitalize">{l.leaveType}</TableCell>
                      <TableCell>{l.daysCount}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{l.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {l.status === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/staff/leave/${l.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "approved" }),
                                  });
                                  const data = await res.json();
                                  if (!data.success) throw new Error(data.message);
                                  toast.success("Approved");
                                  await loadLeaves();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Failed");
                                }
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/staff/leave/${l.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "rejected" }),
                                  });
                                  const data = await res.json();
                                  if (!data.success) throw new Error(data.message);
                                  toast.success("Rejected");
                                  await loadLeaves();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Failed");
                                }
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Year</Label>
              <Input
                type="number"
                className="w-28"
                value={attYear}
                onChange={(e) => setAttYear(Number(e.target.value) || attYear)}
              />
            </div>
            <div className="space-y-1">
              <Label>Month</Label>
              <Select
                value={String(attMonth)}
                onValueChange={(v) => setAttMonth(Number(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2000, i, 1).toLocaleString("en", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" onClick={() => void loadAttendance()}>
              Load month
            </Button>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Mark / update a day</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={attForm.attendanceDate}
                  onChange={(e) =>
                    setAttForm((f) => ({ ...f, attendanceDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={attForm.status}
                  onValueChange={(v) => setAttForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="half_day">Half day</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Check-in (HH:MM)</Label>
                <Input
                  placeholder="09:00"
                  value={attForm.checkIn}
                  onChange={(e) => setAttForm((f) => ({ ...f, checkIn: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Check-out</Label>
                <Input
                  placeholder="18:00"
                  value={attForm.checkOut}
                  onChange={(e) => setAttForm((f) => ({ ...f, checkOut: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Late (min)</Label>
                <Input
                  type="number"
                  value={attForm.lateMinutes}
                  onChange={(e) =>
                    setAttForm((f) => ({ ...f, lateMinutes: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Overtime (min)</Label>
                <Input
                  type="number"
                  value={attForm.overtimeMinutes}
                  onChange={(e) =>
                    setAttForm((f) => ({ ...f, overtimeMinutes: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={attForm.notes}
                  onChange={(e) => setAttForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <Button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/staff/${id}/attendance`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      attendanceDate: attForm.attendanceDate,
                      status: attForm.status,
                      checkIn: attForm.checkIn || undefined,
                      checkOut: attForm.checkOut || undefined,
                      lateMinutes: Number(attForm.lateMinutes) || 0,
                      overtimeMinutes: Number(attForm.overtimeMinutes) || 0,
                      notes: attForm.notes || undefined,
                    }),
                  });
                  const data = await res.json();
                  if (!data.success) throw new Error(data.message);
                  toast.success("Attendance saved");
                  await loadAttendance();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              }}
            >
              Save day
            </Button>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>In / out</TableHead>
                  <TableHead>Late / OT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No rows for this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.attendanceDate}</TableCell>
                      <TableCell className="capitalize">{a.status.replace("_", " ")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[a.checkIn, a.checkOut].filter(Boolean).join(" → ") || "—"}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {a.lateMinutes} / {a.overtimeMinutes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="mt-4 space-y-6">
          <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <Label>Year</Label>
              <Input
                type="number"
                className="w-28"
                value={newPeriodYear}
                onChange={(e) => setNewPeriodYear(Number(e.target.value) || newPeriodYear)}
              />
            </div>
            <div className="space-y-1">
              <Label>Month</Label>
              <Select
                value={String(newPeriodMonth)}
                onValueChange={(v) => setNewPeriodMonth(Number(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2000, i, 1).toLocaleString("en", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={async () => {
                try {
                  const res = await fetch("/api/staff/payroll", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ year: newPeriodYear, month: newPeriodMonth }),
                  });
                  const data = await res.json();
                  if (!data.success) throw new Error(data.message);
                  toast.success("Period ready");
                  await loadPeriods();
                  if (data.period?.id) setSelectedPeriodId(String(data.period.id));
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              }}
            >
              Open period
            </Button>
          </div>

          <div className="space-y-2 max-w-md">
            <Label>Select payroll period</Label>
            <Select
              value={selectedPeriodId}
              onValueChange={(v) => setSelectedPeriodId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose month…" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.year}-{String(p.month).padStart(2, "0")} ({p.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {periodDetail ? (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{periodDetail.period.status}</Badge>
                <span className="text-sm text-muted-foreground">
                  {periodDetail.period.year}-{String(periodDetail.period.month).padStart(2, "0")}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
                <div className="space-y-1">
                  <Label>Period status</Label>
                  <Select
                    value={periodDetail.period.status}
                    onValueChange={async (v) => {
                      try {
                        const res = await fetch(`/api/staff/payroll/${selectedPeriodId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: v }),
                        });
                        const data = await res.json();
                        if (!data.success) throw new Error(data.message);
                        toast.success("Period updated");
                        await loadPeriodDetail(selectedPeriodId);
                        await loadPeriods();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="locked">Locked</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Period notes</Label>
                  <Input
                    value={periodNotes}
                    onChange={(e) => setPeriodNotes(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-1"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/staff/payroll/${selectedPeriodId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ notes: periodNotes }),
                        });
                        const data = await res.json();
                        if (!data.success) throw new Error(data.message);
                        toast.success("Notes saved");
                        await loadPeriodDetail(selectedPeriodId);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Failed");
                      }
                    }}
                  >
                    Save notes
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium">Payroll line for this employee</p>
                <p className="text-xs text-muted-foreground">
                  Totals are computed on the server. Period must be in draft to edit.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(
                    [
                      ["baseSalary", "Base salary"],
                      ["overtimeAmount", "Overtime"],
                      ["holidayDutyAmount", "Holiday duty"],
                      ["eidBonusAmount", "Eid bonus"],
                      ["messAllowanceAmount", "Mess allowance"],
                      ["advanceDeductionAmount", "Advance deduction"],
                      ["absenceDeductionAmount", "Absence"],
                      ["damageChargeAmount", "Damage"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label>{label}</Label>
                      <Input
                        type="number"
                        value={payrollForm[key]}
                        onChange={(e) =>
                          setPayrollForm((f) => ({ ...f, [key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(
                        `/api/staff/payroll/${selectedPeriodId}/entries`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            staffId: Number(staff.id),
                            baseSalary: Number(payrollForm.baseSalary) || 0,
                            overtimeAmount: Number(payrollForm.overtimeAmount) || 0,
                            holidayDutyAmount: Number(payrollForm.holidayDutyAmount) || 0,
                            eidBonusAmount: Number(payrollForm.eidBonusAmount) || 0,
                            messAllowanceAmount: Number(payrollForm.messAllowanceAmount) || 0,
                            otherAdditions: [],
                            advanceDeductionAmount: Number(payrollForm.advanceDeductionAmount) || 0,
                            absenceDeductionAmount: Number(payrollForm.absenceDeductionAmount) || 0,
                            damageChargeAmount: Number(payrollForm.damageChargeAmount) || 0,
                            otherDeductions: [],
                          }),
                        }
                      );
                      const data = await res.json();
                      if (!data.success) throw new Error(data.message);
                      toast.success(
                        `Saved — net PKR ${Number(data.net).toLocaleString()}`
                      );
                      await loadPeriodDetail(selectedPeriodId);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                    }
                  }}
                >
                  Save payroll line
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodDetail.entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.fullName}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(e.grossEarnings).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(e.totalDeductions).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {Number(e.netPayable).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a period to view and edit.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
