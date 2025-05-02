import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if project exists and user is a member
    const project = await prisma.project.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        gitUrl: true,
        gitBranch: true,
        gitProvider: true,
        gitToken: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    if (!project.gitUrl) {
      return NextResponse.json({ gitInfo: null });
    }

    const gitInfo = {
      gitUrl: project.gitUrl,
      gitBranch: project.gitBranch,
      gitProvider: project.gitProvider,
      // For now, return mock data for last commit and PRs
      lastCommit: null,
      pullRequests: [],
    };

    return NextResponse.json({ gitInfo });
  } catch (error) {
    console.error("Error in GET /api/projects/[id]/git:", error);
    return NextResponse.json(
      { error: "Failed to fetch Git information" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if project exists and user is a member
    const project = await prisma.project.findFirst({
      where: {
        id,
        members: {
          some: {
            userId,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    const { gitUrl, gitProvider, gitToken } = await req.json();

    if (!gitUrl || !gitProvider || !gitToken) {
      return NextResponse.json(
        { error: "Git URL, provider, and token are required" },
        { status: 400 }
      );
    }

    // Validate Git URL format based on provider
    const gitUrlPatterns = {
      github: /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/,
      gitlab: /^https:\/\/gitlab\.com\/[\w-]+\/[\w-]+$/,
      bitbucket: /^https:\/\/bitbucket\.org\/[\w-]+\/[\w-]+$/,
    };

    if (!gitUrlPatterns[gitProvider]?.test(gitUrl)) {
      return NextResponse.json(
        { error: "Invalid Git URL format for the selected provider" },
        { status: 400 }
      );
    }

    // Update project with Git information
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        gitUrl,
        gitProvider,
        gitToken,
        gitBranch: "main", // Default branch
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        action: `connected ${gitProvider} repository`,
        projectId: id,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/projects/[id]/git:", error);
    return NextResponse.json(
      { error: "Failed to update Git information" },
      { status: 500 }
    );
  }
}
