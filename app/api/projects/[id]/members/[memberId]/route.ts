import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get member details before deleting
    const member = await prisma.projectMember.findUnique({
      where: { id: params.memberId },
      include: {
        user: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Project member not found" },
        { status: 404 }
      );
    }

    // Delete member
    await prisma.projectMember.delete({
      where: { id: params.memberId },
    });

    // Create activity for member removal
    await prisma.activity.create({
      data: {
        action: `removed ${member.user.name} from the project`,
        projectId: params.id,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Failed to remove project member" },
      { status: 500 }
    );
  }
}
