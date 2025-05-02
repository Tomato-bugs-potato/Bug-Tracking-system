import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bugId = params.id;

    // Get bug
    const bug = await prisma.bug.findUnique({
      where: {
        id: bugId,
      },
      include: {
        project: true,
        reporter: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        attachments: true,
      },
    });

    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    return NextResponse.json({ bug });
  } catch (error) {
    console.error("Error fetching bug:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bugId = params.id;
    const {
      title,
      description,
      stepsToReproduce,
      status,
      priority,
      severity,
      assigneeId,
      userId, // User making the change
    } = await req.json();

    // Get current bug
    const currentBug = await prisma.bug.findUnique({
      where: {
        id: bugId,
      },
      select: {
        status: true,
        assigneeId: true,
        priority: true,
      },
    });

    if (!currentBug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    // Update bug with all fields
    const bug = await prisma.bug.update({
      where: {
        id: bugId,
      },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(stepsToReproduce && { stepsToReproduce }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(severity && { severity }),
        ...(assigneeId !== undefined && { assigneeId }),
      },
    });

    // Create activities for changes
    const activities = [];

    if (status && status !== currentBug.status) {
      const activity = await prisma.activity.create({
        data: {
          action: `changed status from '${currentBug.status}' to '${status}'`,
          bugId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      activities.push(activity);
    }

    if (priority && priority !== currentBug.priority) {
      const activity = await prisma.activity.create({
        data: {
          action: `changed priority from '${currentBug.priority}' to '${priority}'`,
          bugId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      activities.push(activity);
    }

    if (assigneeId && assigneeId !== currentBug.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: {
          id: assigneeId,
        },
        select: {
          name: true,
        },
      });

      const activity = await prisma.activity.create({
        data: {
          action: `assigned this bug to ${assignee?.name}`,
          bugId,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      activities.push(activity);
    }

    return NextResponse.json({ bug, activity: activities[0] });
  } catch (error) {
    console.error("Error updating bug:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  // Handle file upload and create attachment
  // Return attachment details
}
