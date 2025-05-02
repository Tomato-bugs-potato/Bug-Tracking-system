import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            bugs: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await req.json();
    // Accept all editable fields
    const { name, description, status, gitUrl, gitProvider, gitBranch } = body;
    // Optionally, get userId for activity logging
    const userId = req.headers.get("x-user-id");

    // Build update data object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (gitUrl !== undefined) updateData.gitUrl = gitUrl;
    if (gitProvider !== undefined) updateData.gitProvider = gitProvider;
    if (gitBranch !== undefined) updateData.gitBranch = gitBranch;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        members: { include: { user: true } },
      },
    });

    // Optionally, create activity for status change
    if (userId && status !== undefined) {
      await prisma.activity.create({
        data: {
          action: `changed project status to ${status}`,
          projectId: projectId,
          userId,
        },
      });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
