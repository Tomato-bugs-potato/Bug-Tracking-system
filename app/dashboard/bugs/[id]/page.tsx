"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Bug,
  Clock,
  Edit,
  MoreHorizontal,
  PanelRight,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { use } from "react";

interface Bug {
  id: string;
  title: string;
  description: string;
  stepsToReproduce: string | null;
  status: string;
  priority: string;
  severity: string;
  assignee: {
    id: string;
    name: string;
  } | null;
  reporter: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  activities: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }>;
}

export default function BugDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [showSidebar, setShowSidebar] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBug = async () => {
      try {
        const response = await fetch(`/api/bugs/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch bug details");
        }
        const data = await response.json();
        setBug(data.bug);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch bug details"
        );
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch bug details",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users",
        });
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          throw new Error("Failed to fetch current user");
        }
        const data = await response.json();
        setCurrentUserId(data.user?.id || null);
      } catch (err) {
        console.error("Error fetching current user:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch current user",
        });
      }
    };

    fetchBug();
    fetchUsers();
    fetchCurrentUser();
  }, [resolvedParams.id, toast]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    try {
      const response = await fetch(`/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
          bugId: resolvedParams.id,
          userId: currentUserId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const data = await response.json();

      // Create a new comment object with all required fields
      const newCommentObj = {
        id: data.comment.id,
        content: data.comment.content,
        createdAt: data.comment.createdAt,
        user: {
          id: data.comment.user.id,
          name: data.comment.user.name,
        },
      };

      // Create a new activity object
      const newActivity = {
        id: crypto.randomUUID(),
        action: "added comment",
        createdAt: new Date().toISOString(),
        user: {
          id: currentUserId,
          name:
            users.find((u) => u.id === currentUserId)?.name || "Unknown User",
        },
      };

      setBug((prev) =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, newCommentObj],
              activities: [...prev.activities, newActivity],
            }
          : null
      );
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add comment",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/bugs/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          userId: currentUserId, // Add the user ID for activity tracking
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      setBug((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              activities: [...prev.activities, data.activity],
            }
          : null
      );
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      const response = await fetch(`/api/bugs/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priority: newPriority,
          userId: currentUserId, // Add the user ID for activity tracking
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update priority");
      }

      const data = await response.json();
      setBug((prev) =>
        prev
          ? {
              ...prev,
              priority: newPriority,
              activities: [...prev.activities, data.activity],
            }
          : null
      );
      toast({
        title: "Success",
        description: "Priority updated successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update priority",
      });
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string | null) => {
    try {
      const response = await fetch(`/api/bugs/${resolvedParams.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assigneeId: newAssigneeId,
          userId: currentUserId, // Add the user ID for activity tracking
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assignee");
      }

      const data = await response.json();
      setBug((prev) =>
        prev
          ? {
              ...prev,
              assignee: data.bug.assignee,
              activities: [...prev.activities, data.activity],
            }
          : null
      );
      toast({
        title: "Success",
        description: "Assignee updated successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update assignee",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !bug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-destructive mb-4">{error || "Bug not found"}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/bugs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">{bug.id}</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">{bug.title}</h1>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className={`flex-1 ${showSidebar ? "lg:mr-80" : ""}`}>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
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
                  <Badge
                    variant={
                      bug.priority === "HIGH"
                        ? "destructive"
                        : bug.priority === "MEDIUM"
                        ? "default"
                        : "outline"
                    }
                  >
                    {bug.priority}
                  </Badge>
                  <Badge
                    variant={
                      bug.severity === "CRITICAL"
                        ? "destructive"
                        : bug.severity === "MAJOR"
                        ? "default"
                        : "outline"
                    }
                  >
                    {bug.severity}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>Reported by {bug.reporter.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      Created {formatDistanceToNow(new Date(bug.createdAt))} ago
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  <PanelRight className="h-4 w-4" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Bug</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Change Assignee</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <X className="mr-2 h-4 w-4" />
                      <span>Close Bug</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="comments">
                    Comments ({bug.comments.length})
                  </TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <div className="rounded-md bg-muted p-4">
                      <p>{bug.description}</p>
                    </div>
                  </div>
                  {bug.stepsToReproduce && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Steps to Reproduce
                      </h3>
                      <div className="rounded-md bg-muted p-4">
                        <p className="whitespace-pre-line">
                          {bug.stepsToReproduce}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="comments" className="space-y-6">
                  <div className="space-y-4">
                    {bug.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(comment.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {comment.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt))}{" "}
                              ago
                            </span>
                          </div>
                          <p>{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {bug.reporter ? getInitials(bug.reporter.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleAddComment}>Add Comment</Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="activity" className="space-y-4">
                  {bug.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(activity.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {activity.user.name}
                          </span>
                          <span>{activity.action}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.createdAt))}{" "}
                          ago
                        </p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {showSidebar && (
          <div className="w-full lg:fixed lg:right-0 lg:top-16 lg:w-80 lg:border-l lg:h-[calc(100vh-4rem)] lg:overflow-y-auto p-4 bg-background">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Assignee</h3>
                <Select
                  defaultValue={bug.assignee?.id || "unassigned"}
                  onValueChange={(value) =>
                    handleAssigneeChange(value === "unassigned" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Assign Later</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Status</h3>
                <Select
                  defaultValue={bug.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Priority</h3>
                <Select
                  defaultValue={bug.priority}
                  onValueChange={handlePriorityChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Project</h3>
                <div className="text-sm">{bug.project.name}</div>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Dates</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>
                      {formatDistanceToNow(new Date(bug.createdAt))} ago
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>
                      {formatDistanceToNow(new Date(bug.updatedAt))} ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
