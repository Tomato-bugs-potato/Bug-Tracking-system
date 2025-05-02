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
import { GitBranch, GitCommit } from "lucide-react";
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
}

export default function ProjectGitSettingsPage() {
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
      const response = await fetch(`/api/projects/${id}/git`, {
        headers: {
          "x-user-id": localStorage.getItem("userId") || "",
        },
      });

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
        setGitUrl(data.gitInfo.gitUrl || "");
        setGitProvider(data.gitInfo.gitProvider || "");
      }
    } catch (error) {
      console.error("Error fetching git info:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch Git information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch(`/api/projects/${id}/git`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userId") || "",
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

      // Redirect back to project page after successful connection
      router.push(`/dashboard/projects/${id}`);
    } catch (error) {
      console.error("Error connecting git:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to connect Git repository",
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
      <Card>
        <CardHeader>
          <CardTitle>Git Repository Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                required={!gitInfo?.gitUrl}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Please provide a valid access token with repository read
                permissions.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/projects/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : gitInfo?.gitUrl
                  ? "Update Repository"
                  : "Connect Repository"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {gitInfo?.gitUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Current Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span>Repository: {gitInfo.gitUrl}</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                <span>Branch: {gitInfo.gitBranch || "main"}</span>
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
      )}
    </div>
  );
}
