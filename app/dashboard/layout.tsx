"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import { ChevronLeft, ChevronRight, Menu, Bug } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/components/ui/user-profile";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        )}
        <MainNav />
        <div className="ml-auto flex items-center gap-2">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarNav />
              </SheetContent>
            </Sheet>
          )}
          <UserProfile />
        </div>
      </header>
      <div className="flex flex-1">
        {!isMobile && (
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-20 mt-16 border-r bg-background",
              isCollapsed ? "w-16" : "w-64"
            )}
          >
            <SidebarNav isCollapsed={isCollapsed} />
          </aside>
        )}
        <main
          className={cn(
            "flex-1 px-4 py-6 md:px-6 md:py-8",
            !isMobile && (isCollapsed ? "ml-16" : "ml-64")
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
//~I will do it tommorow
