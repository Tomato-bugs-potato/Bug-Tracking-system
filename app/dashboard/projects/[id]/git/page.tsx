"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { GitBranch, GitCommit, GitPullRequest } from "lucide-react";
import { useParams } from "next/navigation";

interface GitInfo {
  gitUrl: string;
  gitBranch: string;
  gitProvider: string;
  lastCommit?: {
    message: string;
    author: string;
    date: string;
  };
  pullRequests?: {
    title: string;
    number: number;
    state: string;
  }[];
}

export default function ProjectGitPage() {
  const params = useParams();
  const id = params.id as string;
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gitUrl, setGitUrl] = useState("");
  const [gitProvider, setGitProvider] = useState("");
  const [gitToken, setGitToken] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchGitInfo();
  }, [id]);

  const fetchGitInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${params.id}/git`, {
        headers: {
          "x-user-id": "cm9x10red0000tlrkfdtkqvbu", // Use a valid user ID from your database
        },
      });

      if (response.status === 404) {
        toast({
          title: "Project not found",
          description: "You may not have access to this project.",
          variant: "destructive",
        });
        router.push("/dashboard/projects");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      if (data.gitInfo === null) {
        setGitInfo(null);
      } else {
        setGitInfo(data.gitInfo);
      }
    } catch (error) {
      console.error("Error fetching git info:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch Git information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitProvider) {
      toast({
        title: "Error",
        description: "Please select a Git provider",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/projects/${params.id}/git`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "cm9x10red0000tlrkfdtkqvbu", // Use a valid user ID from your database
        },
        body: JSON.stringify({
          gitUrl,
          gitProvider,
          gitToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Git repository connected successfully",
      });

      // Reset form and fetch updated info
      setGitUrl("");
      setGitToken("");
      setGitProvider("");
      fetchGitInfo();
    } catch (error) {
      console.error("Error connecting git:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect Git repository. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Git Integration</h1>
        <Button onClick={() => router.push(`/dashboard/projects/${id}`)}>
          Back to Project
        </Button>
      </div>

      {!gitInfo?.gitUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect Git Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Repository URL
                </label>
                <Input
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Git Provider
                </label>
                <Select value={gitProvider} onValueChange={setGitProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="bitbucket">Bitbucket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Access Token
                </label>
                <Input
                  value={gitToken}
                  onChange={(e) => setGitToken(e.target.value)}
                  type="password"
                  placeholder="Enter your access token"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Please provide a valid access token with repository read
                  permissions.
                </p>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Connecting..." : "Connect Repository"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Repository Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span>Repository: {gitInfo.gitUrl}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span>Branch: {gitInfo.gitBranch}</span>
                </div>
                {gitInfo.lastCommit && (
                  <div className="flex items-center gap-2">
                    <GitCommit className="h-4 w-4" />
                    <div>
                      <div>Last Commit: {gitInfo.lastCommit.message}</div>
                      <div className="text-sm text-muted-foreground">
                        by {gitInfo.lastCommit.author} on{" "}
                        {new Date(gitInfo.lastCommit.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {gitInfo.pullRequests && gitInfo.pullRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pull Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gitInfo.pullRequests.map((pr) => (
                    <div key={pr.number} className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4" />
                      <span>
                        #{pr.number} {pr.title} ({pr.state})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
