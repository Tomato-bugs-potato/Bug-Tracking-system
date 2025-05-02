"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LayoutDashboard, FolderKanban, Bug, FileBarChart, Users, Settings, LogOut, User } from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
}

export function SidebarNav({ className, isCollapsed = false, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "Projects",
      icon: FolderKanban,
      href: "/dashboard/projects",
      active: pathname.startsWith("/dashboard/projects"),
    },
    {
      label: "Bugs",
      icon: Bug,
      href: "/dashboard/bugs",
      active: pathname.startsWith("/dashboard/bugs"),
    },
    {
      label: "Reports",
      icon: FileBarChart,
      href: "/dashboard/reports",
      active: pathname.startsWith("/dashboard/reports"),
    },
  ]

  const adminRoutes = [
    {
      label: "Users",
      icon: Users,
      href: "/dashboard/users",
      active: pathname.startsWith("/dashboard/users"),
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname.startsWith("/dashboard/settings"),
    },
  ]

  const accountRoutes = [
    {
      label: "My Account",
      icon: User,
      href: "/dashboard/account",
      active: pathname.startsWith("/dashboard/account"),
    },
    {
      label: "Log out",
      icon: LogOut,
      href: "/api/auth/logout",
      active: false,
    },
  ]

  return (
    <div className={cn("flex flex-col h-full", className)} {...props}>
      <ScrollArea className="flex-1">
        <div className="px-2 py-2">
          <h2 className={cn("mb-2 px-4 text-lg font-semibold tracking-tight", isCollapsed && "sr-only")}>Main</h2>
          <div className="space-y-1">
            {routes.map((route) => (
              <Link key={route.href} href={route.href} passHref>
                <Button
                  variant={route.active ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
                >
                  <route.icon className={cn("h-5 w-5", route.active ? "text-primary" : "text-muted-foreground")} />
                  {!isCollapsed && <span className="ml-2">{route.label}</span>}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div className="px-2 py-2">
          <h2 className={cn("mb-2 px-4 text-lg font-semibold tracking-tight", isCollapsed && "sr-only")}>
            Administration
          </h2>
          <div className="space-y-1">
            {adminRoutes.map((route) => (
              <Link key={route.href} href={route.href} passHref>
                <Button
                  variant={route.active ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
                >
                  <route.icon className={cn("h-5 w-5", route.active ? "text-primary" : "text-muted-foreground")} />
                  {!isCollapsed && <span className="ml-2">{route.label}</span>}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-auto px-2 py-2">
          <div className="space-y-1">
            {accountRoutes.map((route) => (
              <Link key={route.href} href={route.href} passHref>
                <Button
                  variant={route.active ? "secondary" : "ghost"}
                  className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
                >
                  <route.icon className={cn("h-5 w-5", route.active ? "text-primary" : "text-muted-foreground")} />
                  {!isCollapsed && <span className="ml-2">{route.label}</span>}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
