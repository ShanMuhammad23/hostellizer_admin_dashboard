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
  BadgeCheck,
  MessageCircle,
  Star,
  UserCircle,
  ArrowRight,
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
  {
    label: "All students",
    href: "/dashboard/students",
    icon: Users,
    description: "Search, filter & export",
  },
  {
    label: "Add student",
    href: "/dashboard/students?action=add",
    icon: UserPlus,
    description: "Register a new resident",
  },
  {
    label: "Expenses",
    href: "/dashboard/expenses",
    icon: Receipt,
    description: "Track hostel spending",
  },
  {
    label: "Applications",
    href: "/dashboard/applications",
    icon: ClipboardList,
    description: "Review join requests",
  },
  {
    label: "Attendance",
    href: "/dashboard/room-attendance",
    icon: UserCheck,
    description: "Room-wise roll call",
  },
  {
    label: "Staff",
    href: "/dashboard/staff",
    icon: BadgeCheck,
    description: "Payroll & directory",
  },
  {
    label: "Chats",
    href: "/dashboard/chats",
    icon: MessageCircle,
    description: "Message applicants",
  },
  {
    label: "Reviews",
    href: "/dashboard/reviews",
    icon: Star,
    description: "Student feedback",
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: UserCircle,
    description: "Hostel listing & photos",
  },
] as const;

export function DashboardQuickActions() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

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
      const matched = (data.students as StudentHit[])
        .filter(
          (s) =>
            s.name?.toLowerCase().includes(lower) ||
            s.email?.toLowerCase().includes(lower) ||
            String(s.roomnumber ?? "").includes(trimmed)
        )
        .slice(0, 6);
      setHits(matched);
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
    if (q) {
      router.push(`/dashboard/students?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/dashboard/students");
    }
    setOpen(false);
  }

  return (
    <section
      aria-label="Quick actions"
      className="space-y-3 rounded-lg border border-border bg-card p-3 md:p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
          <p className="text-xs text-muted-foreground">
            Find a student or jump to common tasks without digging through the menu.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
          placeholder="Search students by name, email, or room…"
          className="pl-9 pr-24"
        />
        <Button
          type="button"
          size="sm"
          className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2"
          onClick={goToStudentsSearch}
        >
          Search
        </Button>

        {open && query.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
            {searching ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
            ) : hits.length === 0 ? (
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={goToStudentsSearch}
              >
                View all results for &ldquo;{query.trim()}&rdquo;
              </button>
            ) : (
              <ul className="max-h-56 overflow-y-auto py-1">
                {hits.map((s) => (
                  <li key={String(s.id)}>
                    <Link
                      href={`/dashboard/students/${s.id}`}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setOpen(false)}
                    >
                      <span className="truncate font-medium">{s.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {s.roomnumber ? `Room ${s.roomnumber}` : s.email}
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="border-t">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-primary hover:bg-muted"
                    onClick={goToStudentsSearch}
                  >
                    View all in students
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "group flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/30 p-2.5",
              "transition-colors hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            <link.icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold leading-tight">{link.label}</span>
            <span className="hidden text-[10px] leading-snug text-muted-foreground xl:line-clamp-2">
              {link.description}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
