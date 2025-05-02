"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

export default function NewBugPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          setUserId(data.user?.id || null);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects);
        } else {
          throw new Error("Failed to fetch projects");
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load projects. Please try again later.",
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        } else {
          throw new Error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users. Please try again later.",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    checkAuth();
    fetchProjects();
    fetchUsers();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles([...selectedFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!userId) {
      setError("You must be logged in to create a bug");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        title: formData.get("title"),
        description: formData.get("description"),
        stepsToReproduce: formData.get("stepsToReproduce"),
        priority: formData.get("priority"),
        severity: formData.get("severity"),
        projectId: formData.get("projectId"),
        reporterId: userId,
        assigneeId: formData.get("assigneeId"),
      };

      // Create a new FormData for the API request
      const apiFormData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) apiFormData.append(key, value as string);
      });

      // Append files if any
      selectedFiles.forEach((file) => {
        apiFormData.append("files", file);
      });

      const response = await fetch("/api/bugs", {
        method: "POST",
        body: apiFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bug");
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: "Bug created successfully",
      });
      router.push(`/dashboard/bugs/${result.bug.id}`);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err instanceof Error ? err.message : "Failed to create bug");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Project name is required",
      });
      return;
    }

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newProjectName,
          description: newProjectDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const data = await response.json();
      setProjects([...projects, data.project]);
      setShowNewProjectForm(false);
      setNewProjectName("");
      setNewProjectDescription("");

      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Alert variant="destructive">
          <AlertDescription>
            You must be logged in to create a bug. Please log in and try again.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/bugs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Report New Bug</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bug Details</CardTitle>
          <CardDescription>
            Provide detailed information about the bug to help with resolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Bug Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter a descriptive title"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe the bug in detail"
                  className="min-h-32"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
                <Textarea
                  id="stepsToReproduce"
                  name="stepsToReproduce"
                  placeholder="List the steps to reproduce this bug"
                  className="min-h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select name="projectId" required>
                    <SelectTrigger id="projectId">
                      <SelectValue
                        placeholder={
                          isLoadingProjects
                            ? "Loading projects..."
                            : "Select project"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingProjects ? (
                        <SelectItem value="loading" disabled>
                          Loading projects...
                        </SelectItem>
                      ) : projects.length === 0 ? (
                        <SelectItem value="no-projects" disabled>
                          No projects available
                        </SelectItem>
                      ) : (
                        projects.map((project: any) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!isLoadingProjects && projects.length === 0 && (
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewProjectForm(true)}
                      >
                        Create New Project
                      </Button>
                    </div>
                  )}
                </div>

                {showNewProjectForm && (
                  <div className="col-span-full space-y-4 p-4 border rounded-lg">
                    <h3 className="font-medium">Create New Project</h3>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="newProjectName">Project Name</Label>
                        <Input
                          id="newProjectName"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Enter project name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newProjectDescription">
                          Description
                        </Label>
                        <Textarea
                          id="newProjectDescription"
                          value={newProjectDescription}
                          onChange={(e) =>
                            setNewProjectDescription(e.target.value)
                          }
                          placeholder="Enter project description"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" onClick={handleCreateProject}>
                          Create Project
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewProjectForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select name="severity" required>
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="MAJOR">Major</SelectItem>
                      <SelectItem value="MINOR">Minor</SelectItem>
                      <SelectItem value="TRIVIAL">Trivial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" required>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assigneeId">Assignee</Label>
                <Select name="assigneeId">
                  <SelectTrigger id="assigneeId">
                    <SelectValue
                      placeholder={
                        isLoadingUsers
                          ? "Loading users..."
                          : "Assign to team member (optional)"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingUsers ? (
                      <SelectItem value="loading" disabled>
                        Loading users...
                      </SelectItem>
                    ) : users.length === 0 ? (
                      <SelectItem value="no-users" disabled>
                        No users available
                      </SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="files">Attachments</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => document.getElementById("files")?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedFiles(
                              selectedFiles.filter((_, i) => i !== index)
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/dashboard/bugs">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
