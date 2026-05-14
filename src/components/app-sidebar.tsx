"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  IconDashboard,
  IconUserCircle,
  IconUsers,
  IconCash,
  IconStar,
  IconPaperBag,
  IconSettings,
  IconMessage,
  IconUserCheck,
  IconIdBadge2,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { LogOut } from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Profile",
      url: "/dashboard/profile",
      icon: IconUserCircle,
    },
    {
      title: "All Students",
      url: "/dashboard/students",
      icon: IconUsers,
    },
    {
      title: "Staff",
      url: "/dashboard/staff",
      icon: IconIdBadge2,
    },
    {
      title:"Mark Attendance",
      url: "/dashboard/room-attendance",
      icon: IconUserCheck,
    },
    {
      title: "Expenses",
      url: "/dashboard/expenses",
      icon: IconCash,
    },
    {
      title: "Applications",
      url: "/dashboard/applications",
      icon: IconPaperBag,
    },
    {
      title: "Chats",
      url: "/dashboard/chats",
      icon: IconMessage,
    },
    {
      title: "Reviews",
      url: "/dashboard/reviews",
      icon: IconStar
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ 
      redirect: false,
      callbackUrl: "/login"
    });
    router.push("/login");
  };

  return (
    <Sidebar 
      collapsible="offcanvas" 
      {...props}
    >
      <SidebarHeader className="border-b ">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
            >
              <Link href="/" className="text-center">
                Hostellizer Admin Panel
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}