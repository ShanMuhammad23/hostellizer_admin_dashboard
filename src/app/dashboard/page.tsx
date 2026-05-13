
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
import LatestExpenses from "@/components/LatestExpenses"
import { SectionCards } from "@/components/section-cards"
import LatestApplications from "@/components/LatestApplications"
import { DashboardCharts } from "@/components/DashboardCharts"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

async function getSession() {
  return await getServerSession(authOptions)
}

const LoadingSkeleton = () => (
  <div className="flex flex-1 flex-col">
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl ">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-full max-w-[300px] mx-auto bg-card/50 backdrop-blur-lg border border-border/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-[100px]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="w-full p-6 bg-card rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-[150px]" />
              </div>
              <Skeleton className="h-8 w-[100px]" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          </div>
          <div className="w-full p-6 bg-card rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-[150px]" />
              </div>
              <Skeleton className="h-8 w-[100px]" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="w-full p-6 bg-card rounded-lg shadow-sm">
            <Skeleton className="h-6 w-[200px] mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="w-full p-6 bg-card rounded-lg shadow-sm">
            <Skeleton className="h-6 w-[200px] mb-4" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
)

function DashboardContent() {

  return (
    <>
      <SectionCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-2">
        <LatestExpenses />
        <LatestApplications />
      </div>
      <DashboardCharts />
    </>
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
        <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-5">
          <Suspense fallback={<LoadingSkeleton />}>
            <DashboardContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
