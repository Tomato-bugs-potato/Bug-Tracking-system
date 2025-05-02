import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BugStatus, Severity } from "@prisma/client";

export async function GET() {
  try {
    // Get last 6 months trend data
    const trends = await getMonthlyTrends();

    // Get bugs by type (project category)
    const byType = await getBugsByType();

    // Get bugs by severity
    const bySeverity = await getBugsBySeverity();

    // Get resolution times
    const resolutionTimes = await getResolutionTimes();

    return NextResponse.json({
      trends,
      byType,
      bySeverity,
      resolutionTimes,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function getMonthlyTrends() {
  // Get last 6 months
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    // Count reported bugs for the month
    const reportedCount = await prisma.bug.count({
      where: {
        createdAt: {
          gte: month,
          lte: monthEnd,
        },
      },
    });

    // Count resolved bugs for the month
    const resolvedCount = await prisma.bug.count({
      where: {
        status: {
          in: [BugStatus.RESOLVED, BugStatus.CLOSED],
        },
        updatedAt: {
          gte: month,
          lte: monthEnd,
        },
      },
    });

    months.push({
      month: month.toLocaleString("default", { month: "short" }),
      reported: reportedCount,
      resolved: resolvedCount,
    });
  }

  return months;
}

async function getBugsByType() {
  try {
    // Fetch count of bugs per project
    const projectBugs = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            bugs: true,
          },
        },
      },
      orderBy: {
        bugs: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Map to the expected format with colors
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
    ];

    return projectBugs
      .filter((project) => (project._count?.bugs || 0) > 0) // Only show projects with bugs
      .map((project, index) => ({
        type: project.name,
        count: project._count?.bugs || 0,
        color: colors[index % colors.length],
      }));
  } catch (error) {
    console.error("Error in getBugsByType:", error);
    return [];
  }
}

async function getBugsBySeverity() {
  try {
    // Count bugs by severity
    const severities = [
      Severity.CRITICAL,
      Severity.MAJOR,
      Severity.MINOR,
      Severity.TRIVIAL,
    ];
    const counts = await Promise.all(
      severities.map(async (severity) => {
        const count = await prisma.bug.count({
          where: { severity },
        });
        return { severity, count };
      })
    );

    // Map to the expected format with colors
    const colors = {
      [Severity.CRITICAL]: "bg-red-700",
      [Severity.MAJOR]: "bg-red-500",
      [Severity.MINOR]: "bg-yellow-500",
      [Severity.TRIVIAL]: "bg-blue-500",
    };

    return counts
      .filter((item) => item.count > 0) // Only show severities with bugs
      .map((item) => ({
        severity:
          item.severity.charAt(0) + item.severity.slice(1).toLowerCase(),
        count: item.count,
        color: colors[item.severity],
      }));
  } catch (error) {
    console.error("Error in getBugsBySeverity:", error);
    return [];
  }
}

async function getResolutionTimes() {
  try {
    const severities = [
      Severity.CRITICAL,
      Severity.MAJOR,
      Severity.MINOR,
      Severity.TRIVIAL,
    ];
    const resolutionData = [];

    // Mock resolution times - in a real app, you'd calculate actual averages
    const mockResolutionDays = {
      [Severity.CRITICAL]: 1.2,
      [Severity.MAJOR]: 3.5,
      [Severity.MINOR]: 6.8,
      [Severity.TRIVIAL]: 9.2,
    };

    for (const severity of severities) {
      // Get count of bugs with this severity that have been resolved
      const count = await prisma.bug.count({
        where: {
          severity,
          status: {
            in: [BugStatus.RESOLVED, BugStatus.CLOSED],
          },
        },
      });

      if (count > 0) {
        resolutionData.push({
          severity: severity.charAt(0) + severity.slice(1).toLowerCase(),
          days: mockResolutionDays[severity],
          color:
            severity === Severity.CRITICAL
              ? "bg-red-700"
              : severity === Severity.MAJOR
              ? "bg-red-500"
              : severity === Severity.MINOR
              ? "bg-yellow-500"
              : "bg-blue-500",
          value: mockResolutionDays[severity] * 10, // Scale for progress bar (1.2 days -> 12%)
        });
      }
    }

    return resolutionData;
  } catch (error) {
    console.error("Error in getResolutionTimes:", error);
    return [];
  }
}
