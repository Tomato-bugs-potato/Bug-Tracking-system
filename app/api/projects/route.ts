import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// Helper function to generate a unique API key
function generateApiKey() {
  return randomBytes(32).toString("hex");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string)
      : undefined;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "all") {
      where.status = status;
    }

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: {
            bugs: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 5,
        },
        bugs: {
          where: {
            status: {
              in: ["RESOLVED", "CLOSED"],
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      ...(limit ? { take: limit } : {}),
    });

    // Add resolvedBugs count to the _count property
    const enhancedProjects = projects.map((project) => {
      return {
        ...project,
        _count: {
          ...project._count,
          resolvedBugs: project.bugs.length,
        },
        bugs: undefined, // Remove the bugs array since we only needed it for counting
      };
    });

    return NextResponse.json({ projects: enhancedProjects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const {
      name,
      description,
      status,
      memberIds,
      userId,
      gitUrl,
      gitBranch,
      gitProvider,
    } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Generate API key if git details are provided
    const hasGitDetails = gitUrl && gitUrl.trim().length > 0;
    const apiKey = hasGitDetails ? generateApiKey() : null;

    // Create project with members
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        gitUrl: gitUrl || null,
        gitBranch: gitBranch || null,
        gitProvider: gitProvider || null,
        apiKey,
        members: {
          create: [
            // Add creator as owner
            {
              role: "OWNER",
              userId,
            },
            // Add other members, ensuring no duplicates
            ...(memberIds || [])
              .filter((memberId: string) => memberId !== userId) // Don't add creator again
              .map((memberId: string) => ({
                role: "MEMBER",
                userId: memberId,
              })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Create activity for project creation
    await prisma.activity.create({
      data: {
        action: "created this project",
        projectId: project.id,
        userId,
      },
    });

    // Also create activity if Git repository was connected
    if (hasGitDetails) {
      await prisma.activity.create({
        data: {
          action: `connected Git repository: ${gitUrl}`,
          projectId: project.id,
          userId,
        },
      });
    }

    return NextResponse.json(
      {
        project,
        apiKey: apiKey, // Include the API key in the response
        hasGitDetails,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
