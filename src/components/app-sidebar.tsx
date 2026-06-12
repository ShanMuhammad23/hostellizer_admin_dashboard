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
  IconIdBadge2,
} from "@tabler/icons-react"

import { NavMain, type NavMainItem } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LogOut } from "lucide-react"

const navMain: NavMainItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Students",
    icon: IconUsers,
    items: [
      { title: "All students", url: "/dashboard/students" },
      { title: "Guest register", url: "/dashboard/guests" },
      { title: "Room attendance", url: "/dashboard/room-attendance" },
    ],
  },
  {
    title: "Staff",
    icon: IconIdBadge2,
    items: [
      { title: "Staff directory", url: "/dashboard/staff" },
    ],
  },
  {
    title: "Finance",
    icon: IconCash,
    items: [
      { title: "Expenses", url: "/dashboard/expenses" },
    ],
  },
  {
    title: "Admissions",
    icon: IconPaperBag,
    items: [
      { title: "Applications", url: "/dashboard/applications" },
      { title: "Chats", url: "/dashboard/chats" },
    ],
  },
  {
    title: "Community",
    icon: IconStar,
    items: [
      { title: "Reviews", url: "/dashboard/reviews" },
    ],
  },
  {
    title: "Hostel",
    icon: IconUserCircle,
    items: [
      { title: "Profile & photos", url: "/dashboard/profile" },
      { title: "Settings", url: "/dashboard/settings" },
    ],
  },
]

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
        <NavMain items={navMain} />
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
