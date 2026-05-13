"use client"
import {useEffect, useState} from "react"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Users, Home, Bed, Wallet, Receipt, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewData {
  hostel_name: string;
  total_students: number;
  total_rooms: number;
  vacancies_available: number;
  total_rent_collected: string;
  total_expenses: string;
  profit: string;
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
)

export function SectionCards() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/fetchOverviewData');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.success && data.overviewData && data.overviewData.length > 0) {
          setOverviewData(data.overviewData[0]);
          setError(null);
        } else {
          setError('No data available');
        }
      } catch (error) {
        setError('Failed to fetch data. Please check your internet connection and try again!');
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverviewData();
  }, []);

  if (error) {
    return <div className="max-w-md mx-auto p-4 text-red-500 border border-red-500 text-center">{error}</div>;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2 w-full max-w-6xl mx-auto px-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Students",
      value: overviewData?.total_students || 0,
      icon: Users,
      color: "text-white",
      valueColor: "text-white",
      descriptionColor: "text-white",
      bgColor: "bg-primary",
      borderColor: "border",
      hoverBorderColor: "hover:border-primary"
    },
    {
      title: "Rooms Available",
      value: overviewData?.total_rooms || 0,
      icon: Home,
      color: "text-primary",
      valueColor: "text-black",
      descriptionColor: "text-black",
      bgColor: "bg-secondary",
      borderColor: "border",
      hoverBorderColor: "hover:border-primary"
    },
    {
      title: "Vacancies Available",
      value: overviewData?.vacancies_available || 0,
      icon: Bed,
      color: "text-white",
      valueColor: "text-white",
      descriptionColor: "text-white",
      bgColor: "bg-primary",
      borderColor: "border",
      hoverBorderColor: "hover:border-primary"
    },
    {
      title: "Rent Collection",
      value: overviewData?.total_rent_collected || 0,
      icon: Wallet,
      color: "text-white",
      valueColor: "text-black",
      descriptionColor: "text-black",
      bgColor: "bg-secondary",
      borderColor: "border",
      hoverBorderColor: "hover:border-green-400"
    },
    {
      title: "Total Expenses",
      value: overviewData?.total_expenses || 0,
      icon: Receipt,
      color: "text-white",
      valueColor: "text-white",
      descriptionColor: "text-white",
      bgColor: "bg-primary",
      borderColor: "border-purple-200",
      hoverBorderColor: "hover:border-primary"
    },
    {
      title: "Total Revenue",
      value: overviewData?.profit || 0,
      icon: TrendingUp,
      color: "text-black",
      valueColor: "text-black",
      descriptionColor: "text-black",
      bgColor: "bg-secondary",
      borderColor: "border-green-200",
      hoverBorderColor: "hover:border-primary"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-2 w-full max-w-6xl mx-auto px-2">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`${card.bgColor} gap-2 py-3 shadow-none backdrop-blur-sm border ${card.borderColor} ${card.hoverBorderColor} transition-all duration-200 w-full min-w-0`}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 px-3 py-0 pb-1">
            <CardTitle
              className={`text-[11px] sm:text-xs font-medium leading-snug ${card.descriptionColor} line-clamp-2`}
            >
              {card.title}
            </CardTitle>
            <card.icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${card.color}`} />
          </CardHeader>
          <CardContent className="px-3 pt-0 pb-1">
            <CardDescription
              className={`text-base sm:text-lg font-bold tabular-nums tracking-tight ${card.valueColor} line-clamp-2`}
            >
              {card.title === "Rent Collection" || card.title === "Total Expenses" || card.title === "Total Revenue"
                ? `PKR ${Number(card.value).toLocaleString()}`
                : card.value}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}