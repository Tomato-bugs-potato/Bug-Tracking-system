"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bug,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  KanbanIcon as LayoutKanban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface Bug {
  id: string;
  title: string;
  status: string;
  priority: string;
  severity: string;
  assignee?: {
    name: string;
  };
  project: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  source?: string;
}

export default function BugsPage() {
  const [viewType, setViewType] = useState("list");
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    project: "all",
    search: "",
    priority: [] as string[],
    severity: [] as string[],
    assignedToMe: false,
    unassigned: false,
  });

  useEffect(() => {
    fetchBugs();
  }, [filters]);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.status !== "all") {
        queryParams.append("status", filters.status);
      }

      if (filters.project !== "all") {
        queryParams.append("projectId", filters.project);
      }

      if (filters.search) {
        queryParams.append("search", filters.search);
      }

      filters.priority.forEach((priority) => {
        queryParams.append("priority", priority);
      });

      filters.severity.forEach((severity) => {
        queryParams.append("severity", severity);
      });

      if (filters.assignedToMe) {
        queryParams.append("assignedToMe", "true");
      }

      if (filters.unassigned) {
        queryParams.append("unassigned", "true");
      }

      queryParams.append("includeCI", "true");

      console.log("Fetching bugs with params:", queryParams.toString());
      const response = await fetch(`/api/bugs?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bugs");
      }

      const data = await response.json();
      console.log("Received bugs:", data.bugs.length);
      setBugs(data.bugs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleProjectFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, project: value }));
  };

  const handlePriorityFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority.includes(value)
        ? prev.priority.filter((p) => p !== value)
        : [...prev.priority, value],
    }));
  };

  const handleSeverityFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      severity: prev.severity.includes(value)
        ? prev.severity.filter((s) => s !== value)
        : [...prev.severity, value],
    }));
  };

  const handleAssignedToMeFilter = (checked: boolean) => {
    setFilters((prev) => ({ ...prev, assignedToMe: checked }));
  };

  const handleUnassignedFilter = (checked: boolean) => {
    setFilters((prev) => ({ ...prev, unassigned: checked }));
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Bugs</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/bugs/new">
            <Button className="gap-1">
              <Plus className="h-4 w-4" /> New Bug
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search bugs..."
                className="w-full pl-8"
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                  <span className="sr-only">Quick filters</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Quick Filters</h4>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["HIGH", "MEDIUM", "LOW"].map((priority) => (
                        <div
                          key={priority}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`priority-${priority}`}
                            checked={filters.priority.includes(priority)}
                            onCheckedChange={() =>
                              handlePriorityFilter(priority)
                            }
                          />
                          <Label htmlFor={`priority-${priority}`}>
                            {priority}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Assignment</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="assigned-to-me"
                          checked={filters.assignedToMe}
                          onCheckedChange={(checked) =>
                            handleAssignedToMeFilter(checked as boolean)
                          }
                        />
                        <Label htmlFor="assigned-to-me">Assigned to me</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="unassigned"
                          checked={filters.unassigned}
                          onCheckedChange={(checked) =>
                            handleUnassignedFilter(checked as boolean)
                          }
                        />
                        <Label htmlFor="unassigned">Unassigned</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only">Advanced filters</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Advanced Filters</h4>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["CRITICAL", "MAJOR", "MINOR", "TRIVIAL"].map(
                        (severity) => (
                          <div
                            key={severity}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`severity-${severity}`}
                              checked={filters.severity.includes(severity)}
                              onCheckedChange={() =>
                                handleSeverityFilter(severity)
                              }
                            />
                            <Label htmlFor={`severity-${severity}`}>
                              {severity}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filters.status} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.project} onValueChange={handleProjectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="1">Frontend App</SelectItem>
                <SelectItem value="2">Backend API</SelectItem>
                <SelectItem value="3">Mobile App</SelectItem>
                <SelectItem value="4">Admin Dashboard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading bugs...</div>
          </div>
        ) : bugs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No bugs found</div>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b px-4 py-3 font-medium">
              <div className="col-span-5">Bug</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-1">Updated</div>
            </div>
            <div className="divide-y">
              {bugs.map((bug) => (
                <div
                  key={bug.id}
                  className="grid grid-cols-12 items-center px-4 py-3"
                >
                  <div className="col-span-5">
                    <div className="flex items-start gap-2">
                      <Bug className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <Link
                          href={`/dashboard/bugs/${bug.id}`}
                          className="font-medium hover:underline"
                        >
                          {bug.title}
                        </Link>
                        {bug.source && (
                          <Badge variant="outline" className="text-xs">
                            {bug.source}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{bug.id}</span>
                          <span>•</span>
                          <span>{bug.project.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant={
                        bug.status === "OPEN"
                          ? "destructive"
                          : bug.status === "IN_PROGRESS"
                          ? "default"
                          : "outline"
                      }
                    >
                      {bug.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge
                      className={getPriorityColor(bug.priority)}
                      variant="outline"
                    >
                      {bug.priority}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    {bug.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {bug.assignee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{bug.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 text-sm text-muted-foreground">
                    {new Date(bug.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
