import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // First, get regular project activities
    const projectActivities = await prisma.activity.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Next, get bug-related activities for the project's bugs
    const bugActivities = await prisma.activity.findMany({
      where: {
        bug: {
          projectId: projectId,
        },
        bugId: {
          not: null,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        bug: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Combine and sort activities by creation date
    const allActivities = [...projectActivities, ...bugActivities].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ activities: allActivities });
  } catch (error) {
    console.error("Error fetching project activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch project activities" },
      { status: 500 }
    );
  }
}
