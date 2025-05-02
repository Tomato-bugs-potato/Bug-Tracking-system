import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BugStatus, Severity, Priority } from "@prisma/client";

export async function POST() {
  try {
    // Get all bugs
    const bugs = await prisma.bug.findMany({
      select: {
        id: true,
        status: true,
        severity: true,
        priority: true,
      },
    });

    // Update each bug with random values if needed
    const updates = await Promise.all(
      bugs.map(async (bug) => {
        const random = Math.random();
        const data: any = {};

        // Only update if values are not set
        if (!bug.status) {
          data.status =
            random < 0.3
              ? BugStatus.OPEN
              : random < 0.6
              ? BugStatus.IN_PROGRESS
              : random < 0.8
              ? BugStatus.RESOLVED
              : BugStatus.CLOSED;
        }

        if (!bug.severity) {
          data.severity =
            random < 0.25
              ? Severity.CRITICAL
              : random < 0.5
              ? Severity.MAJOR
              : random < 0.75
              ? Severity.MINOR
              : Severity.TRIVIAL;
        }

        if (!bug.priority) {
          data.priority =
            random < 0.33
              ? Priority.HIGH
              : random < 0.66
              ? Priority.MEDIUM
              : Priority.LOW;
        }

        // Only update if there are changes to make
        if (Object.keys(data).length > 0) {
          return prisma.bug.update({
            where: { id: bug.id },
            data,
          });
        }
        return null;
      })
    );

    const updatedCount = updates.filter(Boolean).length;

    return NextResponse.json({
      message: `Updated ${updatedCount} bugs with missing statuses, severities, or priorities`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error updating bug statuses:", error);
    return NextResponse.json(
      {
        error: "Failed to update bug statuses",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
