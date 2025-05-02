import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MainNav } from "@/components/main-nav";
import {
  Bug,
  LayoutDashboard,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8 mx-auto">
          <MainNav />
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container relative px-4 py-24 sm:px-8 md:py-32 mx-auto text-center overflow-hidden">
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(45%_50%_at_50%_50%,var(--gradient-start)_0%,var(--gradient-end)_100%)] opacity-20 dark:opacity-30"
            style={
              {
                "--gradient-start": "var(--primary)",
                "--gradient-end": "transparent",
              } as any
            }
          />
          <div className="mx-auto max-w-3xl relative">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Track, Manage, and Resolve Software Bugs Efficiently
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              A comprehensive bug tracking system for development teams of all
              sizes. Streamline your workflow and improve software quality.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container px-4 py-12 sm:px-8 mx-auto">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="group relative overflow-hidden rounded-xl border bg-background p-6 shadow-md transition-shadow hover:shadow-lg">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <Bug className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Comprehensive</h3>
              <p className="text-sm text-muted-foreground">
                Track bugs with detailed information, attachments, and history
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border bg-background p-6 shadow-md transition-shadow hover:shadow-lg">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Organized</h3>
              <p className="text-sm text-muted-foreground">
                Manage multiple projects with customizable workflows
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border bg-background p-6 shadow-md transition-shadow hover:shadow-lg">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Collaborative</h3>
              <p className="text-sm text-muted-foreground">
                Work together with role-based permissions and notifications
              </p>
            </div>
            <div className="group relative overflow-hidden rounded-xl border bg-background p-6 shadow-md transition-shadow hover:shadow-lg">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">Instant</h3>
              <p className="text-sm text-muted-foreground">
                Get real-time notifications and activity logs
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-b bg-muted/30 dark:bg-muted/10">
          <div className="container px-4 py-16 sm:px-8 mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/80">
              Key Features
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Everything you need to manage your software development process
            </p>

            <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
              {[
                {
                  title: "Bug Reporting",
                  description: "Submit detailed bug reports with attachments",
                  features: [
                    "Detailed bug descriptions",
                    "Steps to reproduce",
                    "Screenshot attachments",
                    "Severity and priority settings",
                  ],
                },
                {
                  title: "Bug Tracking",
                  description: "Track and manage bugs through their lifecycle",
                  features: [
                    "Kanban board view",
                    "List and table views",
                    "Advanced filtering and sorting",
                    "Status and assignment management",
                  ],
                },
                {
                  title: "Project Management",
                  description: "Organize bugs by projects and teams",
                  features: [
                    "Multiple project support",
                    "Team assignment",
                    "Project dashboards",
                    "Customizable workflows",
                  ],
                },
                {
                  title: "Reporting & Analytics",
                  description: "Gain insights with powerful reporting tools",
                  features: [
                    "Bug trend analysis",
                    "Developer performance metrics",
                    "Custom reports",
                    "Export capabilities",
                  ],
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-xl border bg-background p-6 shadow-md transition-all hover:shadow-lg"
                >
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 BugTracker. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
