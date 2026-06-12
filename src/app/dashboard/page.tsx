
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
import LatestExpenses from "@/components/LatestExpenses"
import { SectionCards } from "@/components/section-cards"
import LatestApplications from "@/components/LatestApplications"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardAlertsStrip } from "@/components/dashboard/DashboardAlertsStrip"
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart"
import { OccupancyRoomVisual } from "@/components/dashboard/OccupancyRoomVisual"
import { DashboardBottomStrip } from "@/components/dashboard/DashboardBottomStrip"
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions"

async function getSession() {
  return await getServerSession(authOptions)
}

const LoadingSkeleton = () => (
  <div className="flex flex-1 flex-col gap-4">
    <Skeleton className="h-24 w-full rounded-lg" />
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Skeleton className="h-[320px] rounded-lg" />
      <Skeleton className="h-[320px] rounded-lg" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
    <Skeleton className="h-48 w-full rounded-lg" />
  </div>
)

function DashboardContent() {
  return (
    <div className="flex flex-col gap-4 md:gap-5  mx-auto w-full px-2">
      <DashboardAlertsStrip />
      <DashboardQuickActions />
      <SectionCards />
      <section aria-label="Primary workspace" className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-0.5">
          Primary workspace
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueTrendChart />
          <OccupancyRoomVisual />
        </div>
      </section>
      <section aria-label="Operational intelligence" className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-0.5">
          Operational intelligence
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LatestExpenses variant="operational" />
          <LatestApplications variant="operational" />
        </div>
      </section>
      <DashboardBottomStrip />
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 py-3 md:py-5">
          <Suspense fallback={<LoadingSkeleton />}>
            <DashboardContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
