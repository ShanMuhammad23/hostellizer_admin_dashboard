"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Users, Home, Bed, Wallet, Receipt, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewRow {
  hostel_name: string;
  total_students: number;
  total_rooms: number;
  vacancies_available: number;
  total_rent_collected: string;
  total_expenses: string;
  profit: string;
  rent_trend_pct?: string | null;
  expense_trend_pct?: string | null;
  profit_trend_pct?: string | null;
  new_students_30d?: string | number;
  new_students_prev_30d?: string | number;
  occupancy_pct?: string | null;
}

function num(v: string | number | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr > 0 ? 100 : null;
  return ((curr - prev) / prev) * 100;
}

type StatCardVariant = "primary" | "secondary";

const variantStyles: Record<
  StatCardVariant,
  {
    card: string;
    muted: string;
    trendGood: string;
    trendBad: string;
  }
> = {
  primary: {
    card: "bg-primary text-primary-foreground border-primary/25",
    muted: "text-primary-foreground/80",
    trendGood: "text-emerald-100",
    trendBad: "text-red-100",
  },
  secondary: {
    card: "bg-secondary text-secondary-foreground border-border",
    muted: "text-secondary-foreground/85",
    trendGood: "text-emerald-800",
    trendBad: "text-red-700",
  },
};

function TrendLine({
  pct,
  invert = false,
  suffix = "vs prior 30d",
  variant = "secondary",
}: {
  pct: number | null;
  invert?: boolean;
  suffix?: string;
  variant?: StatCardVariant;
}) {
  const styles = variantStyles[variant];
  if (pct == null || Number.isNaN(pct)) {
    return (
      <p className={`mt-1 text-[10px] leading-tight ${styles.muted}`}>
        {suffix}: —
      </p>
    );
  }
  const good = invert ? pct <= 0 : pct >= 0;
  return (
    <p
      className={`mt-1 flex items-center gap-1 text-[10px] font-medium leading-tight ${
        good ? styles.trendGood : styles.trendBad
      }`}
    >
      <span>{pct >= 0 ? "↑" : "↓"}</span>
      <span>{Math.abs(Math.round(pct))}%</span>
      <span className={`font-normal ${styles.muted}`}>{suffix}</span>
    </p>
  );
}

const CardSkeleton = () => (
  <Card className="w-full gap-2 py-3 shadow-none bg-card/50 backdrop-blur-lg border">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 py-0 pb-1">
      <Skeleton className="h-3 w-20 sm:w-24" />
      <Skeleton className="h-3.5 w-3.5 rounded" />
    </CardHeader>
    <CardContent className="px-3 pt-0 pb-1">
      <Skeleton className="h-6 w-16 sm:w-20" />
    </CardContent>
  </Card>
);

export function SectionCards() {
  const [overviewData, setOverviewData] = useState<OverviewRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/fetchOverviewData");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success && data.overviewData && data.overviewData.length > 0) {
          setOverviewData(data.overviewData[0] as OverviewRow);
          setError(null);
        } else {
          setError("No data available");
        }
      } catch (e) {
        setError(
          "Failed to fetch data. Please check your internet connection and try again!"
        );
        console.error("Error fetching data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverviewData();
  }, []);

  if (error) {
    return (
      <div className="max-w-md mx-auto p-4 text-red-500 border border-red-500 text-center rounded-md">
        {error}
      </div>
    );
  }

  if (isLoading || !overviewData) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2 w-full  mx-auto px-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  const o = overviewData;
  const rentPct = num(o.rent_trend_pct);
  const expPct = num(o.expense_trend_pct);
  const profitPct = num(o.profit_trend_pct);
  const new30 = num(o.new_students_30d);
  const newPrev = num(o.new_students_prev_30d);
  const studentFlowPct = pctDelta(new30, newPrev);
  const occPct = num(o.occupancy_pct);
  const cap = Math.max(1, (o.total_rooms || 0) * 2);
  const vacPct = (num(o.vacancies_available) / cap) * 100;

  const cards: {
    title: string;
    value: string | number;
    money: boolean;
    icon: typeof Users;
    variant: StatCardVariant;
    trend: ReactNode;
  }[] = [
    {
      title: "Students",
      value: o.total_students,
      money: false,
      icon: Users,
      variant: "primary",
      trend: (
        <>
          <TrendLine
            pct={studentFlowPct}
            suffix="new vs prior 30d"
            variant="primary"
          />
          {new30 > 0 ? (
            <p
              className={`text-[10px] leading-tight ${variantStyles.primary.muted}`}
            >
              +{new30} joined last 30 days
            </p>
          ) : null}
        </>
      ),
    },
    {
      title: "Rooms",
      value: o.total_rooms,
      money: false,
      icon: Home,
      variant: "secondary",
      trend: (
        <p
          className={`mt-1 text-[10px] leading-tight ${variantStyles.secondary.muted}`}
        >
          {occPct > 0 ? `${Math.round(occPct)}% beds filled` : "—"}
        </p>
      ),
    },
    {
      title: "Vacancies",
      value: o.vacancies_available,
      money: false,
      icon: Bed,
      variant: "primary",
      trend: (
        <p
          className={`mt-1 text-[10px] leading-tight ${variantStyles.primary.muted}`}
        >
          {vacPct > 0 ? `${Math.round(vacPct)}% of beds free` : "—"}
        </p>
      ),
    },
    {
      title: "Rent collected",
      value: o.total_rent_collected,
      money: true,
      icon: Wallet,
      variant: "secondary",
      trend: <TrendLine pct={rentPct} variant="secondary" />,
    },
    {
      title: "Expenses",
      value: o.total_expenses,
      money: true,
      icon: Receipt,
      variant: "primary",
      trend: <TrendLine pct={expPct} invert variant="primary" />,
    },
    {
      title: "Profit",
      value: o.profit,
      money: true,
      icon: TrendingUp,
      variant: "secondary",
      trend: <TrendLine pct={profitPct} variant="secondary" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2 w-full  mx-auto px-2">
      {cards.map((card, index) => {
        const styles = variantStyles[card.variant];
        return (
          <Card
            key={index}
            className={`${styles.card} gap-2 py-3 shadow-none backdrop-blur-sm transition-all duration-200 w-full min-w-0 hover:brightness-[0.98]`}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 px-3 py-0 pb-1">
              <CardTitle className="text-[11px] sm:text-xs font-medium leading-snug line-clamp-2">
                {card.title}
              </CardTitle>
              <card.icon className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-90" />
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-1">
              <p className="text-base sm:text-lg font-bold tabular-nums tracking-tight line-clamp-2">
                {card.money
                  ? `PKR ${Number(card.value).toLocaleString()}`
                  : card.value}
              </p>
              {card.trend}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
