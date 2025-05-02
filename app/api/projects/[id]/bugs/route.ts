import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string)
      : undefined;

    // Build where clause
    const where: any = { projectId };
    if (status && status !== "all") {
      where.status = status;
    }

    const bugs = await prisma.bug.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        severity: true,
        createdAt: true,
        updatedAt: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
          },
        },
        source: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      ...(limit ? { take: limit } : {}),
    });

    return NextResponse.json({ bugs });
  } catch (error) {
    console.error("Error fetching project bugs:", error);
    return NextResponse.json(
      { error: "Failed to fetch project bugs" },
      { status: 500 }
    );
  }
}
