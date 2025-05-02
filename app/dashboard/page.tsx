"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Bug,
  CheckCircle,
  Clock,
  FileBarChart2,
  FolderKanban,
  Plus,
  Users,
  BarChart,
  LineChart,
  PieChart,
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/prisma";

// Define interfaces for our data structures
interface DashboardStats {
  totalBugs: number;
  openBugs: number;
  resolvedBugs: number;
  activeProjects: number;
  totalUsers: number;
  percentChange: {
    totalBugs: number;
    openBugs: number;
    resolvedBugs: number;
    activeProjects: number;
    totalUsers: number;
  };
}

interface RecentBug {
  id: string;
  title: string;
  project: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "TRIVIAL";
  createdAt: string;
}

interface TeamActivity {
  id: string;
  user: {
    name: string;
    initial: string;
  };
  action: string;
  time: string;
}

interface ProjectStatus {
  id: string;
  name: string;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD";
  progress: number;
}

// Add new analytics data interfaces
interface BugTrend {
  month: string;
  reported: number;
  resolved: number;
}

interface BugByType {
  type: string;
  count: number;
  color: string;
}

interface BugBySeverity {
  severity: string;
  count: number;
  color: string;
}

// Add an interface for resolution times
interface ResolutionTime {
  severity: string;
  days: number;
  color: string;
  value: number;
}

// Helper function to get severity color
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-500";
    case "MAJOR":
      return "bg-yellow-500";
    case "MINOR":
      return "bg-blue-500";
    case "TRIVIAL":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

// Helper function for status color
const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return {
        dot: "bg-green-500",
        text: "text-green-500",
        bg: "bg-green-500/10",
        gradient: "bg-gradient-to-r from-green-500 to-green-400",
      };
    case "ON_HOLD":
      return {
        dot: "bg-yellow-500",
        text: "text-yellow-500",
        bg: "bg-yellow-500/10",
        gradient: "bg-gradient-to-r from-yellow-500 to-yellow-400",
      };
    case "COMPLETED":
      return {
        dot: "bg-blue-500",
        text: "text-blue-500",
        bg: "bg-blue-500/10",
        gradient: "bg-gradient-to-r from-blue-500 to-blue-400",
      };
    default:
      return {
        dot: "bg-gray-500",
        text: "text-gray-500",
        bg: "bg-gray-500/10",
        gradient: "bg-gradient-to-r from-gray-500 to-gray-400",
      };
  }
};

// Function to format relative time (e.g., "2 hours ago")
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBugs, setRecentBugs] = useState<RecentBug[]>([]);
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [projects, setProjects] = useState<ProjectStatus[]>([]);
  const [bugTrends, setBugTrends] = useState<BugTrend[]>([]);
  const [bugsByType, setBugsByType] = useState<BugByType[]>([]);
  const [bugsBySeverity, setBugsBySeverity] = useState<BugBySeverity[]>([]);
  const [resolutionTimes, setResolutionTimes] = useState<ResolutionTime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch dashboard stats
        const fetchStats = async () => {
          const response = await fetch("/api/dashboard/stats");
          if (!response.ok) throw new Error("Failed to fetch dashboard stats");
          return response.json();
        };

        // Fetch recent bugs
        const fetchRecentBugs = async () => {
          const response = await fetch("/api/bugs?limit=5");
          if (!response.ok) throw new Error("Failed to fetch recent bugs");
          return response.json();
        };

        // Fetch team activity
        const fetchTeamActivity = async () => {
          const response = await fetch("/api/activities?limit=5");
          if (!response.ok) throw new Error("Failed to fetch team activity");
          return response.json();
        };

        // Fetch projects status
        const fetchProjects = async () => {
          const response = await fetch("/api/projects");
          if (!response.ok) throw new Error("Failed to fetch projects");
          return response.json();
        };

        // Fetch bug analytics
        const fetchBugAnalytics = async () => {
          const response = await fetch("/api/dashboard/analytics");
          if (!response.ok) throw new Error("Failed to fetch bug analytics");
          return response.json();
        };

        // Execute all fetches in parallel
        const [statsData, bugsData, activityData, projectsData, analyticsData] =
          await Promise.all([
            fetchStats(),
            fetchRecentBugs(),
            fetchTeamActivity(),
            fetchProjects(),
            fetchBugAnalytics(),
          ]);

        // Process the data
        setStats(statsData.stats);

        // Process bugs data
        const recentBugsFormatted = bugsData.bugs.map((bug: any) => ({
          id: bug.id,
          title: bug.title,
          project: bug.project?.name || "Unknown Project",
          severity: bug.severity || "MINOR",
          createdAt: formatRelativeTime(bug.createdAt),
        }));
        setRecentBugs(recentBugsFormatted);

        // Process activity data
        const teamActivityFormatted = activityData.activities.map(
          (activity: any) => ({
            id: activity.id,
            user: {
              name: activity.user?.name || "Unknown User",
              initial: activity.user?.name ? activity.user.name.charAt(0) : "?",
            },
            action: activity.action,
            time: formatRelativeTime(activity.createdAt),
          })
        );
        setTeamActivity(teamActivityFormatted);

        // Process projects data
        const projectsFormatted = projectsData.projects.map((project: any) => {
          // Calculate progress (example logic - in reality you might have a more complex calculation)
          const bugsTotal = project._count?.bugs || 0;
          const resolvedBugsCount = project._count?.resolvedBugs || 0;
          const progress =
            bugsTotal > 0
              ? Math.round((resolvedBugsCount / bugsTotal) * 100)
              : 0;

          return {
            id: project.id,
            name: project.name,
            status: project.status,
            progress: progress || 0,
          };
        });
        setProjects(projectsFormatted);

        // Process analytics data
        setBugTrends(analyticsData.trends || []);
        setBugsByType(analyticsData.byType || []);
        setBugsBySeverity(analyticsData.bySeverity || []);
        setResolutionTimes(analyticsData.resolutionTimes || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to render the correct icon and color for percent changes
  const renderPercentChange = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-500">
          <ArrowUp className="h-3 w-3 mr-1" />
          <span>+{value}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-500">
          <ArrowDown className="h-3 w-3 mr-1" />
          <span>{value}%</span>
        </div>
      );
    }
    return <span>0%</span>;
  };

  // Function to calculate percentage
  const calculatePercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1) + "%";
  };

  // Calculate totals for analytics
  const totalBugsByType = bugsByType.reduce((acc, item) => acc + item.count, 0);
  const totalBugsBySeverity = bugsBySeverity.reduce(
    (acc, item) => acc + item.count,
    0
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground/80">
          Overview of your bug tracking statistics and activities
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/bugs/new">
            <Button className="gap-1">
              <Plus className="h-4 w-4" /> New Bug
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bugs</CardTitle>
            <Bug className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stats?.totalBugs || 0}
                </div>
                <div className="text-xs text-muted-foreground/80 flex items-center">
                  {stats && renderPercentChange(stats.percentChange.totalBugs)}{" "}
                  from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Bugs</CardTitle>
            <Clock className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stats?.openBugs}
                </div>
                <div className="text-xs text-muted-foreground/80 flex items-center">
                  {stats && renderPercentChange(stats.percentChange.openBugs)}{" "}
                  from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Bugs</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stats?.resolvedBugs}
                </div>
                <div className="text-xs text-muted-foreground/80 flex items-center">
                  {stats &&
                    renderPercentChange(stats.percentChange.resolvedBugs)}{" "}
                  from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stats?.activeProjects}
                </div>
                <div className="text-xs text-muted-foreground/80 flex items-center">
                  {stats &&
                    renderPercentChange(
                      stats.percentChange.activeProjects
                    )}{" "}
                  from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-primary/70" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stats?.totalUsers}
                </div>
                <div className="text-xs text-muted-foreground/80 flex items-center">
                  {stats && renderPercentChange(stats.percentChange.totalUsers)}{" "}
                  from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-background border">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary/10"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="data-[state=active]:bg-primary/10"
          >
            Recent Activity
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-primary/10"
          >
            Analytics
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Recent Bugs
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Latest reported bugs across all projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentBugs.length > 0 ? (
                  <div className="space-y-4">
                    {recentBugs.map((bug) => (
                      <Link
                        href={`/dashboard/bugs/${bug.id}`}
                        key={bug.id}
                        className="block"
                      >
                        <div className="flex items-center gap-4 hover:bg-muted/50 p-3 rounded-lg transition-all duration-200">
                          <div
                            className={`h-2 w-2 rounded-full ${getSeverityColor(
                              bug.severity
                            )}`}
                          />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {bug.title}
                            </p>
                            <p className="text-xs text-muted-foreground/80">
                              {bug.project} • {bug.createdAt}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground/80">
                    No bugs reported yet.
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-1 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Team Activity
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Recent actions by team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-lg transition-all duration-200"
                      >
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {activity.user.initial}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            {activity.action} • {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-1 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Project Status
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">
                  Overview of active projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        key={project.id}
                      >
                        <div className="space-y-3 hover:bg-muted/50 p-3 rounded-lg transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  project.status === "ACTIVE"
                                    ? "bg-green-500"
                                    : project.status === "ON_HOLD"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              <p className="text-sm font-medium">
                                {project.name}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                project.status === "ACTIVE"
                                  ? "text-green-500 bg-green-500/10"
                                  : project.status === "ON_HOLD"
                                  ? "text-yellow-500 bg-yellow-500/10"
                                  : "text-blue-500 bg-blue-500/10"
                              }`}
                            >
                              {project.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs text-muted-foreground/80">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                  project.status === "ACTIVE"
                                    ? "bg-gradient-to-r from-green-500 to-green-400"
                                    : project.status === "ON_HOLD"
                                    ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                    : "bg-gradient-to-r from-blue-500 to-blue-400"
                                }`}
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground/80">
                    No projects available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                All activity across your projects in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="mt-1 h-5 w-5 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {teamActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Bug Trends Over Time</CardTitle>
                <CardDescription>
                  Number of bugs reported vs resolved over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                ) : (
                  <div className="h-full w-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm">Reported</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm">Resolved</span>
                      </div>
                    </div>
                    <div className="relative flex-1">
                      {/* Simple chart representation */}
                      <div className="absolute inset-0 flex items-end justify-between">
                        {bugTrends.length > 0 ? (
                          bugTrends.map((month, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center w-1/6"
                            >
                              <div className="relative w-full h-full flex items-end justify-center gap-1">
                                <div
                                  className="w-6 bg-blue-500 rounded-t transition-all duration-300"
                                  style={{
                                    height: `${
                                      month.reported === 0
                                        ? 0
                                        : Math.max(
                                            (month.reported /
                                              Math.max(
                                                ...bugTrends.map(
                                                  (m) => m.reported
                                                )
                                              )) *
                                              200,
                                            20
                                          )
                                    }px`,
                                  }}
                                >
                                  <div className="absolute -top-5 text-xs whitespace-nowrap">
                                    {month.reported}
                                  </div>
                                </div>
                                <div
                                  className="w-6 bg-green-500 rounded-t transition-all duration-300"
                                  style={{
                                    height: `${
                                      month.resolved === 0
                                        ? 0
                                        : Math.max(
                                            (month.resolved /
                                              Math.max(
                                                ...bugTrends.map(
                                                  (m) => m.resolved
                                                )
                                              )) *
                                              200,
                                            20
                                          )
                                    }px`,
                                  }}
                                >
                                  <div className="absolute -top-5 text-xs whitespace-nowrap">
                                    {month.resolved}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {month.month}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="w-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                              No trend data available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Bugs by Type</CardTitle>
                  <CardDescription>
                    Distribution of bug categories
                  </CardDescription>
                </div>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : bugsByType.length > 0 ? (
                  <div className="space-y-4">
                    {bugsByType.map((type, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{type.type}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{type.count}</span>
                            <span className="text-xs text-muted-foreground">
                              (
                              {calculatePercentage(type.count, totalBugsByType)}
                              )
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${type.color}`}
                            style={{
                              width: `${(type.count / totalBugsByType) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No bug type data available.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Bugs by Severity</CardTitle>
                  <CardDescription>Impact level assessment</CardDescription>
                </div>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bugsBySeverity.map((severity, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {severity.severity}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{severity.count}</span>
                            <span className="text-xs text-muted-foreground">
                              (
                              {calculatePercentage(
                                severity.count,
                                totalBugsBySeverity
                              )}
                              )
                            </span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${severity.color}`}
                            style={{
                              width: `${
                                (severity.count / totalBugsBySeverity) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Bug Resolution Time</CardTitle>
                  <CardDescription>
                    Average days to fix by severity
                  </CardDescription>
                </div>
                <LineChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : resolutionTimes.length > 0 ? (
                  <div className="space-y-6">
                    {resolutionTimes.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{item.severity}</p>
                          <p className="text-sm font-medium">
                            {item.days} days
                          </p>
                        </div>
                        <Progress
                          value={item.value}
                          max={100}
                          className="h-2"
                          indicatorClassName={item.color}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No resolution time data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
