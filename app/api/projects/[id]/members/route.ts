import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get project members
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

// Add a member to a project
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { userId, role = "MEMBER" } = await req.json();
    const requestingUserId = req.headers.get("x-user-id");

    // Validate inputs
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the member already exists in the project
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // Add member to project
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create activity record
    if (requestingUserId) {
      await prisma.activity.create({
        data: {
          action: `added ${user.name} to the project`,
          projectId,
          userId: requestingUserId,
        },
      });
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json(
      { error: "Failed to add project member" },
      { status: 500 }
    );
  }
}

// Remove a member from a project
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const requestingUserId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if member exists
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found in this project" },
        { status: 404 }
      );
    }

    // Remove member
    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId,
      },
    });

    // Create activity record
    if (requestingUserId) {
      await prisma.activity.create({
        data: {
          action: `removed ${member.user.name} from the project`,
          projectId,
          userId: requestingUserId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Failed to remove project member" },
      { status: 500 }
    );
  }
}
