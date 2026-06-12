"use client"

import { useEffect, useState } from "react"
import { type Icon } from "@tabler/icons-react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export type NavMainItem = {
  title: string
  url?: string
  icon?: Icon
  items?: { title: string; url: string }[]
}

function isActivePath(pathname: string, url: string) {
  if (url === "/dashboard") return pathname === "/dashboard"
  return pathname === url || pathname.startsWith(`${url}/`)
}

function groupIsActive(pathname: string, item: NavMainItem) {
  if (item.url && isActivePath(pathname, item.url)) return true
  return item.items?.some((sub) => isActivePath(pathname, sub.url)) ?? false
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const item of items) {
        if (item.items?.length && groupIsActive(pathname, item)) {
          next[item.title] = true
        }
      }
      return next
    })
  }, [pathname, items])

  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if (item.items?.length) {
              const expanded = openGroups[item.title] ?? false
              const active = groupIsActive(pathname, item)

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    type="button"
                    onClick={() => toggleGroup(item.title)}
                    isActive={active}
                    className={cn(active && "bg-primary/10 text-primary")}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon className="size-4" />}
                    <span className="flex-1 text-left">{item.title}</span>
                    <ChevronRight
                      className={cn(
                        "size-4 shrink-0 transition-transform",
                        expanded && "rotate-90"
                      )}
                    />
                  </SidebarMenuButton>
                  {expanded && (
                    <SidebarMenuSub>
                      {item.items.map((sub) => (
                        <SidebarMenuSubItem key={sub.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActivePath(pathname, sub.url)}
                          >
                            <Link href={sub.url}>{sub.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )
            }

            if (!item.url) return null

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActivePath(pathname, item.url)}
                  className={cn(
                    isActivePath(pathname, item.url) && "bg-primary text-white"
                  )}
                  tooltip={item.title}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
