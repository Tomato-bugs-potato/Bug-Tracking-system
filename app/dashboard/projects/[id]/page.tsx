"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch,
  Bug,
  AlertTriangle,
  Users,
  Plus,
  Clock,
  Copy,
  RefreshCw,
  Github,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  gitUrl?: string;
  gitProvider?: string;
  gitBranch?: string;
  apiKey?: string;
  members: ProjectMember[];
}

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface Activity {
  id: string;
  action: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  bugId?: string;
  bug?: {
    id: string;
    title: string;
  };
}

interface BugItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  severity: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
  };
  reporter?: {
    id: string;
    name: string;
  };
  source?: string;
}

const DEFAULT_NODEJS_TEMPLATE = `
name: Test and Bug Tracking

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests and capture output
        id: run_tests
        continue-on-error: true
        run: |
          npm test > test_output.txt 2>&1
          echo "exit_code=$?" >> $GITHUB_ENV
          cat test_output.txt

      - name: Create bug in tracking system 
        run: |
          # Get the test output for the bug report
          TEST_OUTPUT=$(cat test_output.txt)

          # Extract failing test names
          FAILED_TESTS=$(grep -A 1 "FAIL" test_output.txt | grep -v "FAIL" | grep -v "\\-\\-" | sed 's/^[ \\t]*//' | tr '\\n' ',' | sed 's/,$//' || echo "Unknown test failure")

          # Count failures
          FAILURE_COUNT=$(grep -c "FAIL" test_output.txt || echo "0")

          # Create a descriptive bug title
          BUG_TITLE="URGENT: $FAILURE_COUNT Test Failures in \${{ github.repository }} (\$(date '+%Y-%m-%d %H:%M:%S'))"

          echo "Creating bug with title: $BUG_TITLE"
          echo "Failed tests: $FAILED_TESTS"

          # Convert test output to base64 to include in the request
          ENCODED_OUTPUT=$(echo "$TEST_OUTPUT" | base64 -w 0)

          # Use a hardcoded URL for testing
          BUG_TRACKER_API="https://zspnb989-3000.uks1.devtunnels.ms/api/ci-report"

          # Make the API request to create a bug (with verbose output for debugging)
          curl -v -X POST "$BUG_TRACKER_API" \\
            -H "Content-Type: application/json" \\
            -H "Azure-DevTunnel-Bypass: 1" \\
            -H "Authorization: Bearer \${{ secrets.BUG_TRACKER_API_KEY }}" \\
            -d "{
              \\"projectId\\": \\"\${{ secrets.BUG_TRACKER_PROJECT_ID }}\\",
              \\"commit\\": \\"\${{ github.sha }}\\",
              \\"branch\\": \\"\${{ github.ref_name }}\\",
              \\"repository\\": \\"\${{ github.repository }}\\",
              \\"bugTitle\\": \\"$BUG_TITLE\\",
              \\"testOutput\\": \\"$ENCODED_OUTPUT\\",
              \\"failedTests\\": \\"$FAILED_TESTS\\",
              \\"failureCount\\": \\"$FAILURE_COUNT\\"
            }" 2>&1 | grep -v "Authorization"
`.trim();

const DEFAULT_PYTHON_TEMPLATE = `
name: Test and Bug Tracking

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: |
          if [ -f "requirements.txt" ]; then pip install -r requirements.txt; fi
          if [ -f "pyproject.toml" ]; then pip install .; fi

      - name: Run tests and capture output
        id: run_tests
        continue-on-error: true
        run: |
          pytest > test_output.txt 2>&1
          echo "exit_code=$?" >> $GITHUB_ENV
          cat test_output.txt

      - name: Create bug in tracking system 
        run: |
          TEST_OUTPUT=$(cat test_output.txt)
          FAILED_TESTS=$(grep -A 1 "FAILED" test_output.txt | grep -v "FAILED" | grep -v "\\-\\-" | sed 's/^[ \\t]*//' | tr '\\n' ',' | sed 's/,$//' || echo "Unknown test failure")
          FAILURE_COUNT=$(grep -c "FAILED" test_output.txt || echo "0")
          BUG_TITLE="URGENT: $FAILURE_COUNT Test Failures in \${{ github.repository }} (\$(date '+%Y-%m-%d %H:%M:%S'))"
          ENCODED_OUTPUT=$(echo "$TEST_OUTPUT" | base64 -w 0)
          BUG_TRACKER_API="https://zspnb989-3000.uks1.devtunnels.ms/api/ci-report"
          curl -v -X POST "$BUG_TRACKER_API" \\
            -H "Content-Type: application/json" \\
            -H "Azure-DevTunnel-Bypass: 1" \\
            -H "Authorization: Bearer \${{ secrets.BUG_TRACKER_API_KEY }}" \\
            -d "{
              \\"projectId\\": \\"\${{ secrets.BUG_TRACKER_PROJECT_ID }}\\",
              \\"commit\\": \\"\${{ github.sha }}\\",
              \\"branch\\": \\"\${{ github.ref_name }}\\",
              \\"repository\\": \\"\${{ github.repository }}\\",
              \\"bugTitle\\": \\"$BUG_TITLE\\",
              \\"testOutput\\": \\"$ENCODED_OUTPUT\\",
              \\"failedTests\\": \\"$FAILED_TESTS\\",
              \\"failureCount\\": \\"$FAILURE_COUNT\\"
            }" 2>&1 | grep -v "Authorization"
`.trim();

const DEFAULT_MOCHA_TEMPLATE = `
name: Test and Bug Tracking

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test-and-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run tests and capture output
        id: run_tests
        continue-on-error: true
        run: |
          npx mocha > test_output.txt 2>&1
          echo "exit_code=$?" >> $GITHUB_ENV
          cat test_output.txt

      - name: Create bug in tracking system 
        run: |
          TEST_OUTPUT=$(cat test_output.txt)
          FAILED_TESTS=$(grep -A 1 "failing" test_output.txt | grep -v "failing" | grep -v "\\-\\-" | sed 's/^[ \\t]*//' | tr '\\n' ',' | sed 's/,$//' || echo "Unknown test failure")
          FAILURE_COUNT=$(grep -c "failing" test_output.txt || echo "0")
          BUG_TITLE="URGENT: $FAILURE_COUNT Test Failures in \${{ github.repository }} (\$(date '+%Y-%m-%d %H:%M:%S'))"
          ENCODED_OUTPUT=$(echo "$TEST_OUTPUT" | base64 -w 0)
          BUG_TRACKER_API="https://zspnb989-3000.uks1.devtunnels.ms/api/ci-report"
          curl -v -X POST "$BUG_TRACKER_API" \\
            -H "Content-Type: application/json" \\
            -H "Azure-DevTunnel-Bypass: 1" \\
            -H "Authorization: Bearer \${{ secrets.BUG_TRACKER_API_KEY }}" \\
            -d "{
              \\"projectId\\": \\"\${{ secrets.BUG_TRACKER_PROJECT_ID }}\\",
              \\"commit\\": \\"\${{ github.sha }}\\",
              \\"branch\\": \\"\${{ github.ref_name }}\\",
              \\"repository\\": \\"\${{ github.repository }}\\",
              \\"bugTitle\\": \\"$BUG_TITLE\\",
              \\"testOutput\\": \\"$ENCODED_OUTPUT\\",
              \\"failedTests\\": \\"$FAILED_TESTS\\",
              \\"failureCount\\": \\"$FAILURE_COUNT\\"
            }" 2>&1 | grep -v "Authorization"
`.trim();

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [lastCommit, setLastCommit] = useState<{
    message: string;
    author: string;
    date: string;
    url: string;
  } | null>(null);
  const [users, setUsers] = useState<
    { id: string; name: string; email: string; image?: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("MEMBER");
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [addingMember, setAddingMember] = useState<boolean>(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [regeneratingKey, setRegeneratingKey] = useState<boolean>(false);
  const [ciTemplates, setCiTemplates] = useState<{ [key: string]: string }>({});
  const [selectedStack, setSelectedStack] = useState("nodejs");
  const [totalBugs, setTotalBugs] = useState(0);
  const [openBugs, setOpenBugs] = useState(0);
  const [resolvedBugs, setResolvedBugs] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [activeProjectCount, setActiveProjectCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchActivities();
      fetchProjectBugs();
      fetchUsers();
    }
  }, [id]);

  useEffect(() => {
    const fetchLastCommit = async () => {
      if (project?.gitUrl && project.gitUrl.includes("github.com")) {
        try {
          const match = project.gitUrl.match(
            /github.com\/(.+?)\/(.+?)(.git)?$/
          );
          if (!match) return;

          const owner = match[1];
          const repo = match[2].replace(/.git$/, "");
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`;

          const res = await fetch(apiUrl);
          const data = await res.json();

          if (data && data.length > 0) {
            setLastCommit({
              message: data[0].commit.message,
              author: data[0].commit.author.name,
              date: data[0].commit.author.date,
              url: data[0].html_url,
            });
          }
        } catch (e) {
          console.error("Error fetching last commit:", e);
          // Set a default message when fetch fails
          setLastCommit({
            message: "Unable to fetch latest commit",
            author: "Unknown",
            date: new Date().toISOString(),
            url: project.gitUrl,
          });
        }
      }
    };
    fetchLastCommit();
  }, [project]);

  useEffect(() => {
    fetch("/api/bug-tracker-templates")
      .then((res) => res.text())
      .then((md) => {
        // Simple regex parsing for demo (use a markdown parser for production)
        const nodejs = md.match(
          /### Node\.js \(Jest\)[\s\S]+?```yaml([\s\S]+?)```/
        );
        const python = md.match(
          /### Python \(Pytest\)[\s\S]+?```yaml([\s\S]+?)```/
        );
        const mocha = md.match(
          /### Node\.js \(Mocha\)[\s\S]+?```yaml([\s\S]+?)```/
        );
        setCiTemplates({
          nodejs: nodejs ? nodejs[1].trim() : "",
          python: python ? python[1].trim() : "",
          mocha: mocha ? mocha[1].trim() : "",
        });
      });
  }, []);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => res.json())
      .then((data) => {
        setTotalBugs(data.totalBugs);
        setOpenBugs(data.openBugs);
        setResolvedBugs(data.resolvedBugs);
        setProjectCount(data.totalProjects);
        setActiveProjectCount(data.activeProjects);
        setTeamCount(data.totalUsers);
        setRecentActivity(data.recentActivity);
      });
  }, []);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      const data = await response.json();
      setProject(data.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch project",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/activities`);
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      const data = await response.json();
      setActivities(data.activities);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  };

  const fetchProjectBugs = async () => {
    try {
      const response = await fetch(`/api/projects/${id}/bugs?limit=5`);
      if (!response.ok) {
        throw new Error("Failed to fetch project bugs");
      }
      const data = await response.json();
      setBugs(data.bugs);
    } catch (err) {
      console.error("Failed to fetch project bugs:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users. Please try again.",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const addMember = async () => {
    if (!selectedUserId) return;

    try {
      setAddingMember(true);
      const response = await fetch(`/api/projects/${id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId") || "",
        },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to add member",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Team member added as ${selectedRole.toLowerCase()}`,
      });

      // Refresh project to get updated members
      fetchProject();
      fetchActivities();
      setSelectedUserId("");
      setSelectedRole("MEMBER");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add team member",
      });
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      setRemovingMember(memberId);
      const response = await fetch(`/api/projects/${id}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": localStorage.getItem("userId") || "",
        },
      });

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove team member",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Team member removed successfully",
      });

      // Refresh project to get updated members
      fetchProject();
      fetchActivities();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove team member",
      });
    } finally {
      setRemovingMember(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getBugStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const regenerateApiKey = async () => {
    try {
      setRegeneratingKey(true);
      console.log(localStorage.getItem("userId"));
      const response = await fetch(`/api/projects/${id}/regenerate-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": project?.members[0].id || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate API key");
      }
      const data = await response.json();
      console.log(data);
      setProject((prev) => ({
        ...prev!,
        apiKey: data.apiKey,
      }));

      toast({
        title: "Success",
        description: "API key regenerated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to regenerate API key",
      });
    } finally {
      setRegeneratingKey(false);
    }
  };

  const copyApiKey = () => {
    if (project?.apiKey) {
      navigator.clipboard.writeText(project.apiKey);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    }
  };

  const copyProjectId = () => {
    if (project?.id) {
      navigator.clipboard.writeText(project.id);
      toast({
        title: "Copied!",
        description: "Project ID copied to clipboard",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !project) {
    return (
      <div className="text-destructive">{error || "Project not found"}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm" className="gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Projects
          </Button>
        </Link>
      </div>

      {/* Project Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 shadow-sm border relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 h-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="240"
            height="240"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge
                variant="secondary"
                className={getStatusColor(project.status)}
              >
                {project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              {project.description || "No description provided"}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 text-primary"
                >
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                  <line x1="16" x2="16" y1="2" y2="6"></line>
                  <line x1="8" x2="8" y1="2" y2="6"></line>
                  <line x1="3" x2="21" y1="10" y2="10"></line>
                  <path d="M8 14h.01"></path>
                  <path d="M12 14h.01"></path>
                  <path d="M16 14h.01"></path>
                  <path d="M8 18h.01"></path>
                  <path d="M12 18h.01"></path>
                  <path d="M16 18h.01"></path>
                </svg>
                Created {new Date(project.createdAt).toLocaleDateString()}
              </div>

              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Updated {new Date(project.updatedAt).toLocaleString()}
              </div>

              {project.gitUrl && (
                <div className="flex items-center text-sm">
                  <GitBranch className="h-4 w-4 mr-2 text-primary" />
                  <a
                    href={project.gitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary truncate max-w-[300px]"
                  >
                    {project.gitUrl.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              className="gap-2 shadow-sm"
              onClick={() =>
                router.push(`/dashboard/bugs/new?projectId=${project.id}`)
              }
            >
                <Bug className="h-4 w-4" />
                New Bug
              </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-sm"
              onClick={() =>
                router.push(`/dashboard/projects/${project.id}/settings/git`)
              }
            >
                <GitBranch className="h-4 w-4" />
              {project.gitUrl ? "Git Settings" : "Connect Git"}
              </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-sm"
              onClick={() =>
                router.push(`/dashboard/projects/${project.id}/settings`)
              }
            >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
                Edit
              </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Bug Metric */}
        <div className="bg-white dark:bg-card rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Bugs
              </h3>
              <div className="flex items-baseline mt-1">
                <span className="text-3xl font-bold">{totalBugs}</span>
                <Link
                  href={`/dashboard/bugs?projectId=${id}`}
                  className="ml-2 text-xs text-blue-600 hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="flex items-center mt-1">
                {bugs.filter((b) => b.priority.toLowerCase() === "high")
                  .length > 0 && (
                  <Badge variant="outline" className="text-red-500 text-xs">
                    {
                      bugs.filter((b) => b.priority.toLowerCase() === "high")
                        .length
                    }{" "}
                    high
                  </Badge>
                )}
              </div>
            </div>
            <div className="h-12 w-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500">
              <Bug className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Team Metric */}
        <div className="bg-white dark:bg-card rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Team
              </h3>
              <div className="flex items-baseline mt-1">
                <span className="text-3xl font-bold">
                  {project.members.length}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  members
                </span>
              </div>
              <div className="flex -space-x-2 mt-1">
                {project.members.slice(0, 4).map((member) => (
                  <Avatar
                    key={member.id}
                    className="h-6 w-6 border-2 border-background"
                  >
                    {member.user.image ? (
                      <AvatarImage
                        src={member.user.image}
                        alt={member.user.name}
                      />
                    ) : (
                      <AvatarFallback className="text-xs">
                        {member.user.name.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}
                {project.members.length > 4 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    +{project.members.length - 4}
                  </div>
                )}
              </div>
            </div>
            <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Activity Metric */}
        <div className="bg-white dark:bg-card rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Activity
              </h3>
              <div className="flex items-baseline mt-1">
                <span className="text-3xl font-bold">{activities.length}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  events
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Last:{" "}
                {activities.length > 0
                  ? new Date(activities[0].createdAt).toLocaleDateString()
                  : "No activity"}
              </div>
            </div>
            <div className="h-12 w-12 bg-violet-50 dark:bg-violet-900/20 rounded-full flex items-center justify-center text-violet-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="m9 13 2 2 4-5"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Git Metric */}
        <div className="bg-white dark:bg-card rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Git</h3>
              <div className="flex items-baseline mt-1">
                <span className="text-3xl font-bold">
                  {project.gitUrl ? "Connected" : "No"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {project.gitProvider || "Not connected"}
                {project.gitBranch && ` (${project.gitBranch})`}
              </div>
            </div>
            <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500">
              <GitBranch className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>Team Members</span>
                </CardTitle>
                <Badge variant="outline" className="font-normal">
                  {project.members.length} members
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {project.members && project.members.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto">
                    {project.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 group"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9 border-2 border-background">
                            {member.user.image ? (
                              <AvatarImage
                                src={member.user.image}
                                alt={member.user.name}
                              />
                            ) : (
                              <AvatarFallback>
                                {member.user.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.user.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.user.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 dark:bg-blue-950/30"
                          >
                            {member.role}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => removeMember(member.id)}
                            disabled={removingMember === member.id}
                          >
                            {removingMember === member.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                              </svg>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-blue-50 dark:bg-blue-950/30 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-muted-foreground">No team members yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Add members to collaborate
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t mt-2">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Add Team Member</div>
                    {loadingUsers && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Loading users...
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      disabled={loadingUsers}
                    >
                      <option value="">-- Select a user to add --</option>
                      {loadingUsers ? (
                        <option value="" disabled>
                          Loading users...
                        </option>
                      ) : users.filter(
                          (user) =>
                            !project.members.some(
                              (member) => member.user.id === user.id
                            )
                        ).length === 0 ? (
                        <option value="" disabled>
                          All users are already members
                        </option>
                      ) : (
                        users
                          .filter(
                            (user) =>
                              !project.members.some(
                                (member) => member.user.id === user.id
                              )
                          )
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))
                      )}
                    </select>
                    <div className="flex space-x-2">
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        disabled={!selectedUserId}
                      >
                        <option value="OWNER">Owner</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <Button
                        onClick={addMember}
                        disabled={!selectedUserId || addingMember}
                        className="px-4 h-9"
                        size="sm"
                      >
                        {addingMember ? (
                          <>
                            <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Adding...
                          </>
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Git Info Card */}
          {project.gitUrl && (
            <Card className="overflow-hidden border-none shadow-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 pb-2 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-emerald-500" />
                  <span>Git Repository</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex-shrink-0">
                    {project.gitProvider === "github" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        className="text-emerald-500"
                      >
                        <path
                          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                          fill="currentColor"
                        />
                      </svg>
                    ) : (
                      <GitBranch className="h-6 w-6 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Repository URL</h3>
                    <a
                      href={project.gitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all"
                    >
                      {project.gitUrl}
                    </a>
                    <div className="flex flex-wrap mt-2 gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-50 dark:bg-emerald-950/30"
                      >
                        {project.gitProvider || "git"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs bg-emerald-50 dark:bg-emerald-950/30"
                      >
                        {project.gitBranch || "main"}
                      </Badge>
                    </div>
                  </div>
                </div>
                {lastCommit ? (
                  <div className="border-t pt-3 mt-3">
                    <h3 className="text-sm font-medium mb-1">Latest Commit</h3>
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-md">
                      <a
                        href={lastCommit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline break-all line-clamp-2"
                      >
                        {lastCommit.message}
                      </a>
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {new Date(lastCommit.date).toLocaleString()}
                        <span className="mx-1">•</span>
                        <span>{lastCommit.author}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-3 mt-3">
                    <h3 className="text-sm font-medium mb-1">Latest Commit</h3>
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        No commit information available
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bugs and Activity Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bugs Card */}
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bug className="h-5 w-5 text-red-500" />
                  <span>Project Bugs</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/bugs?projectId=${id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9Z" />
                        <path d="m21 16-4-4 4-4" />
                      </svg>
                      View All
                    </Button>
                  </Link>
                  <Link href={`/dashboard/bugs/new?projectId=${id}`}>
                    <Button size="sm" className="h-8 gap-1 text-xs">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14"></path>
                        <path d="M5 12h14"></path>
                      </svg>
                      Add Bug
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div>
                {bugs.length > 0 ? (
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {bugs.map((bug) => (
                      <div key={bug.id} className="p-4 hover:bg-muted/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/dashboard/bugs/${bug.id}`}
                              className="text-base font-medium hover:underline truncate block"
                            >
                              {bug.title}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className={getBugStatusColor(bug.status)}
                              >
                                {bug.status}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={getPriorityColor(bug.priority)}
                              >
                                {bug.priority}
                              </Badge>
                              {bug.source && (
                                <Badge variant="outline" className="text-xs">
                                  {bug.source}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                            {new Date(bug.updatedAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-sm">
                          <div className="flex items-center">
                            {bug.assignee ? (
                              <div className="flex items-center">
                                <Avatar className="h-5 w-5 mr-1">
                                  <AvatarFallback className="text-[10px]">
                                    {bug.assignee.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  Assigned to {bug.assignee.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Unassigned
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            {bug.reporter && (
                              <span className="text-xs text-muted-foreground">
                                Reported by {bug.reporter.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-red-50 dark:bg-red-950/30 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                      <Bug className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-muted-foreground">
                      No bugs found for this project
                    </p>
                    <p className="text-sm text-muted-foreground/70 mb-4 mt-1">
                      Everything seems to be working fine!
                    </p>
                    <Link href={`/dashboard/bugs/new?projectId=${id}`}>
                      <Button size="sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M12 5v14"></path>
                          <path d="M5 12h14"></path>
                        </svg>
                        Add First Bug
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Card */}
          {activities.length > 0 && (
            <Card className="overflow-hidden border-none shadow-sm">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 pb-2 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-violet-500"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                <div className="relative pl-8 py-0 before:absolute before:left-[16px] before:top-0 before:h-full before:w-[2px] before:bg-border">
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={`relative pb-4 ${
                        index === activities.length - 1 ? "" : ""
                      }`}
                    >
                      <div className="absolute left-[-13px] top-0 h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-950/50 border-4 border-background flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-violet-500" />
                      </div>
                      <div className="pl-4 pt-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.user.name}
                          </span>{" "}
                          {activity.action}
                          {activity.bugId && activity.bug && (
                            <>
                              {" "}
                              <Link
                                href={`/dashboard/bugs/${activity.bugId}`}
                                className="text-blue-600 hover:underline"
                              >
                                {activity.bug.title}
                              </Link>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* GitHub Integration Section */}
      {project && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              <div className="flex items-center">
                <Github className="mr-2 h-5 w-5" />
                GitHub Integration
              </div>
            </CardTitle>
            {!project.gitUrl && (
              <Button
                size="sm"
                onClick={() =>
                  router.push(`/dashboard/projects/${project.id}/settings/git`)
                }
              >
                Connect GitHub
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {project.gitUrl ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Repository
                    </h3>
                    <div className="flex items-center">
                      <a
                        href={project.gitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {project.gitUrl}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Default Branch
                    </h3>
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 mr-1 text-gray-400" />
                      {project.gitBranch || "main"}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-4">
                    CI Integration Credentials
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-8 items-center gap-2">
                      <Label className="text-xs md:col-span-2">
                        Project ID:
                      </Label>
                      <div className="relative md:col-span-5">
                        <Input
                          value={project.id}
                          readOnly
                          className="pr-10 font-mono text-sm bg-gray-50"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 md:col-span-1"
                        onClick={copyProjectId}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-8 items-center gap-2">
                      <Label className="text-xs md:col-span-2">API Key:</Label>
                      <div className="relative md:col-span-5">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={project.apiKey || "No API key generated"}
                          readOnly
                          className="pr-10 font-mono text-sm bg-gray-50"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-500"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </Button>
                      </div>
                      <div className="md:col-span-1 flex">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={copyApiKey}
                          disabled={!project.apiKey}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={regenerateApiKey}
                        disabled={regeneratingKey}
                        className="flex items-center"
                      >
                        <RefreshCw className="mr-1 h-3.5 w-3.5" />
                        {regeneratingKey
                          ? "Regenerating..."
                          : "Regenerate API Key"}
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">Setup Instructions</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader className="space-y-3 pb-4 border-b">
                            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                              GitHub CI Integration Setup
                            </DialogTitle>
                            <DialogDescription className="text-base text-muted-foreground/80">
                              Follow these steps to enable automated bug
                              creation from test failures.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6 py-4">
                            {/* Step 1: Add GitHub Secrets */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                  1
                                </div>
                                <h3 className="font-medium text-lg">
                                  Add GitHub Secrets
                              </h3>
                              </div>
                              <div className="ml-8">
                                <p className="text-sm text-muted-foreground/80 mb-3">
                                Add these secrets to your GitHub repository:
                              </p>
                                <div className="space-y-3">
                                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium">
                                          BUG_TRACKER_API_KEY
                                        </p>
                                        <p className="text-xs text-muted-foreground/80 mt-1 font-mono break-all">
                                          {project.apiKey ||
                                            "No API key generated"}
                                        </p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          navigator.clipboard.writeText(
                                            project.apiKey || ""
                                          )
                                        }
                                        className="h-8 px-3"
                                      >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="rounded-lg border bg-card p-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium">
                                          BUG_TRACKER_PROJECT_ID
                                        </p>
                                        <p className="text-xs text-muted-foreground/80 mt-1 font-mono break-all">
                                  {project.id}
                                </p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          navigator.clipboard.writeText(
                                            project.id
                                          )
                                        }
                                        className="h-8 px-3"
                                      >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Step 2: Create GitHub Workflow File */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                  2
                                </div>
                                <h3 className="font-medium text-lg">
                                  Create GitHub Workflow File
                              </h3>
                              </div>
                              <div className="ml-8">
                                <p className="text-sm text-muted-foreground/80 mb-3">
                                Choose your stack and copy the workflow file:
                              </p>
                                <div className="space-y-3">
                              <select
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={selectedStack}
                                onChange={(e) =>
                                  setSelectedStack(e.target.value)
                                }
                              >
                                    <option value="nodejs">
                                      Node.js (Jest)
                                    </option>
                                    <option value="python">
                                      Python (Pytest)
                                    </option>
                                    <option value="mocha">
                                      Node.js (Mocha)
                                    </option>
                              </select>
                                  <div className="relative rounded-lg border bg-muted">
                                    <div className="flex items-center justify-between p-3 border-b bg-card">
                                      <p className="text-sm font-medium">
                                        workflow.yml
                                      </p>
                                <Button
                                        variant="outline"
                                  size="sm"
                                        onClick={() => {
                                          const template =
                                            selectedStack === "nodejs"
                                          ? DEFAULT_NODEJS_TEMPLATE
                                          : selectedStack === "python"
                                          ? DEFAULT_PYTHON_TEMPLATE
                                              : DEFAULT_MOCHA_TEMPLATE;
                                          navigator.clipboard.writeText(
                                            template
                                          );
                                        }}
                                        className="h-8 px-3"
                                      >
                                        <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </Button>
                                    </div>
                                    <pre className="p-4 overflow-x-auto text-xs font-mono">
                                      <code>
                                        {selectedStack === "nodejs"
                                          ? DEFAULT_NODEJS_TEMPLATE
                                          : selectedStack === "python"
                                          ? DEFAULT_PYTHON_TEMPLATE
                                          : DEFAULT_MOCHA_TEMPLATE}
                                      </code>
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Step 3: Push to GitHub */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                  3
                                </div>
                                <h3 className="font-medium text-lg">
                                  Push to GitHub
                                </h3>
                              </div>
                              <div className="ml-8">
                                <p className="text-sm text-muted-foreground/80 mb-3">
                                Commit and push these changes to your
                                  repository:
                                </p>
                                <div className="bg-card border rounded-lg p-4 font-mono text-sm space-y-2">
                                  <p>git add .github/workflows/test.yml</p>
                                  <p>
                                    git commit -m "Add test failure tracking
                                    workflow"
                                  </p>
                                  <p>git push</p>
                            </div>
                          </div>
                            </div>
                          </div>

                          <DialogFooter className="border-t pt-4">
                            <Button
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `BUG_TRACKER_API_KEY: ${project.apiKey}\nBUG_TRACKER_PROJECT_ID: ${project.id}`
                                )
                              }
                              className="gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copy All Credentials
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  No GitHub repository connected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Connect a GitHub repository to enable automatic bug creation
                  from test failures.
                </p>
                <div className="mt-6">
                  <Button
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/dashboard/projects/${project.id}/settings/git`
                      )
                    }
                  >
                    Connect GitHub
                    </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
