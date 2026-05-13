"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import MegaLoader from "@/components/ui/MegaLoader"

const DashboardContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarInset className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col gap-4  pt-0">
        {children}
      </main>
    </SidebarInset>
  );
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <MegaLoader />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <DashboardContent>
        {children}
      </DashboardContent>
    </SidebarProvider>
  )
}

export default DashboardLayout
