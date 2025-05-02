"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Bug, GitBranch, Settings } from "lucide-react";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { id } = params;

  // Ensure we have an id
  useEffect(() => {
    if (!id) {
      router.push("/dashboard/projects");
    }
  }, [id, router]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/projects"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Projects
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-2xl font-bold">Project Dashboard</h1>
        </div>
      </div>

      <nav className="flex space-x-4 border-b pb-4">
        <Link
          href={`/dashboard/projects/${id}`}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
            pathname === `/dashboard/projects/${id}`
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <Bug className="h-4 w-4" />
          <span>Overview</span>
        </Link>
        <Link
          href={`/dashboard/projects/${id}/settings/git`}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
            pathname === `/dashboard/projects/${id}/settings/git`
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <GitBranch className="h-4 w-4" />
          <span>Git</span>
        </Link>
        <Link
          href={`/dashboard/projects/${id}/settings`}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
            pathname === `/dashboard/projects/${id}/settings`
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </nav>

      {children}
    </div>
  );
}
