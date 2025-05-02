"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  ChevronDown,
  Clock,
  Plus,
  Search,
  MoreHorizontal,
  Users,
  Bug,
  GitBranch,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  _count: {
    bugs: number;
    members: number;
  };
  gitUrl?: string;
  lastActivity?: string;
  members?: {
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState("card");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data.projects);
    } catch (err) {
      setError("Failed to load projects. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description &&
        project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  // List of team members (example - would normally come from API)
  const renderProjectMembers = (count: number) => {
    if (count === 0)
      return <span className="text-muted-foreground text-sm">No members</span>;

    return (
      <div className="flex items-center">
        <span className="font-medium mr-1">{count}</span>
        <Users className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  };

  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bugs</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Git</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProjects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mb-2 opacity-20" />
                  <p>No projects found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="font-medium">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  </div>
                  <div className="text-muted-foreground text-sm line-clamp-1">
                    {project.description || "No description"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(project.status)}
                  >
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="font-medium mr-1">
                      {project._count.bugs}
                    </span>
                    <Bug className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TableCell>
                <TableCell>
                  {renderProjectMembers(project._count.members)}
                </TableCell>
                <TableCell>
                  {project.gitUrl ? (
                    <div className="flex items-center text-blue-600">
                      <GitBranch className="h-4 w-4 mr-1" />
                      <span className="text-sm">Connected</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Not connected
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="h-3 w-3 mr-1 inline" />
                    {new Date(project.updatedAt).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}/edit`}>
                          Edit Project
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/bugs/new?projectId=${project.id}`}
                        >
                          Add Bug
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/bugs?projectId=${project.id}`}>
                          View Bugs
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredProjects.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="h-12 w-12 mb-2 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">No projects found</p>
        </div>
      ) : (
        filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="flex flex-col hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="hover:underline"
                >
                  {project.name}
                </Link>
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={getStatusColor(project.status)}
                >
                  {project.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last updated: {new Date(project.updatedAt).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-2 min-h-[48px]">
                {project.description || "No description provided"}
              </p>

              <div className="flex justify-between mt-4">
                <div className="flex flex-col items-center p-2 bg-muted rounded-md px-3">
                  <div className="flex items-center">
                    <Bug className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="font-medium">{project._count.bugs}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Bugs</span>
                </div>

                <div className="flex flex-col items-center p-2">
                  <div className="flex -space-x-2 mb-1">
                    {project.members &&
                      project.members.slice(0, 3).map((member, index) => (
                        <Avatar
                          key={member.user.id}
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
                    {project._count.members > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                        +{project._count.members - 3}
                      </div>
                    )}
                    {!project.members?.length &&
                      project._count.members === 0 && (
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Users className="h-4 w-4 mr-1" />
                          No members
                        </div>
                      )}
                  </div>
                  <span className="text-xs text-muted-foreground">Team</span>
                </div>

                <div className="flex flex-col items-center p-2 bg-muted rounded-md px-3">
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="font-medium">
                      {project.gitUrl ? "Yes" : "No"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">Git</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0 mt-auto">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/bugs?projectId=${project.id}`}>
                  <Bug className="h-4 w-4 mr-2" />
                  Bugs
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href={`/dashboard/projects/${project.id}`}>
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
                    className="mr-2"
                  >
                    <path d="M12 20v-6M6 20V10M18 20V4" />
                  </svg>
                  Details
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <Link href="/dashboard/projects/new">
          <Button className="gap-1">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          </div>
          <div className="flex items-center gap-2">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="ACTIVE">Active</TabsTrigger>
              <TabsTrigger value="ON_HOLD">On Hold</TabsTrigger>
              <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1">
                <span>{viewType === "card" ? "Card View" : "Table View"}</span>{" "}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setViewType("table")}>
                Table View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewType("card")}>
                Card View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        ) : error ? (
        <div className="rounded-md bg-destructive/15 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
          </div>
      ) : viewType === "table" ? (
        renderTableView()
      ) : (
        renderCardView()
      )}
    </div>
  );
}
