import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get total bugs count (all bugs regardless of status)
    const totalBugs = await prisma.bug.count();

    // Get bugs by status (with proper null handling)
    const openBugs = await prisma.bug.count({
      where: {
        status: {
          equals: "OPEN",
        },
      },
    });

    const resolvedBugs = await prisma.bug.count({
      where: {
        status: {
          in: ["RESOLVED", "CLOSED"],
        },
      },
    });

    // Get bugs created in the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const lastMonthBugs = await prisma.bug.count({
      where: {
        createdAt: {
          gte: lastMonth,
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalBugs,
        openBugs,
        resolvedBugs,
        lastMonthBugs,
        percentChange:
          lastMonthBugs > 0
            ? (((totalBugs - lastMonthBugs) / lastMonthBugs) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching total bugs:", error);
    return NextResponse.json(
      { error: "Failed to fetch total bugs" },
      { status: 500 }
    );
  }
}
