import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { Priority, Severity } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const search = searchParams.get("search");
    const priorities = searchParams.getAll("priority");
    const severities = searchParams.getAll("severity");
    const assignedToMe = searchParams.get("assignedToMe") === "true";
    const unassigned = searchParams.get("unassigned") === "true";
    const includeCI = searchParams.get("includeCI") === "true";
    const userId = req.headers.get("x-user-id");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") as string)
      : undefined;

    console.log("API received search params:", {
      status,
      projectId,
      search,
      priorities,
      severities,
      assignedToMe,
      unassigned,
      includeCI,
      limit,
    });

    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (projectId && projectId !== "all") {
      where.projectId = projectId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (priorities.length > 0) {
      where.priority = { in: priorities };
    }

    if (severities.length > 0) {
      where.severity = { in: severities };
    }

    if (assignedToMe && userId) {
      where.assigneeId = userId;
    }

    if (unassigned) {
      where.assigneeId = null;
    }

    // Add includeCI option that will ensure CI bugs are returned
    // If not specifically requested, make no changes to filtering

    console.log("Final query where clause:", where);

    const bugs = await prisma.bug.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        severity: true,
        assignee: {
          select: {
            name: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        source: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      ...(limit ? { take: limit } : {}),
    });

    console.log(
      `Found ${bugs.length} bugs, including ${
        bugs.filter((b) => b.source === "CI").length
      } CI bugs`
    );

    return NextResponse.json({ bugs });
  } catch (error) {
    console.error("Error fetching bugs:", error);
    return NextResponse.json(
      { error: "Failed to fetch bugs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    console.log("Bug creation request received");

    // Check content type and parse accordingly
    const contentType = req.headers.get("content-type") || "";
    let data: any;
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      // Handle form data
      const formData = await req.formData();
      console.log("Received form data");

      // Extract files from form data
      files = formData.getAll("files") as File[];

      // Convert form data to object
      data = {};
      for (const [key, value] of formData.entries()) {
        if (key !== "files") {
          data[key] = value;
        }
      }
    } else if (contentType.includes("application/json")) {
      // Handle JSON data
      console.log("Received JSON data");
      data = await req.json();
    } else {
      console.error("Unsupported content type:", contentType);
      return NextResponse.json(
        {
          error: "Failed to create bug",
          details: `Content-Type was not one of "multipart/form-data" or "application/json". Received: ${contentType}`,
        },
        { status: 400 }
      );
    }

    console.log("Parsed request data:", {
      title: data.title,
      projectId: data.projectId,
      reporterId: data.reporterId,
      source: data.source,
    });

    const title = data.title as string;
    const description = data.description as string;
    const stepsToReproduce = data.stepsToReproduce as string;
    const priority = data.priority as Priority;
    const severity = data.severity as Severity;
    const projectId = data.projectId as string;
    const reporterId = data.reporterId as string;
    const assigneeId = data.assigneeId as string;
    const source = data.source as string;

    // Validate required fields
    if (!title || !description || !projectId || !reporterId) {
      console.error("Missing required fields:", {
        title: !!title,
        description: !!description,
        projectId: !!projectId,
        reporterId: !!reporterId,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.log("Project not found:", projectId);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate reporter exists
    const reporter = await prisma.user.findUnique({
      where: { id: reporterId },
    });

    if (!reporter) {
      console.log("Reporter not found:", reporterId);
      return NextResponse.json(
        { error: "Reporter not found" },
        { status: 404 }
      );
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (!assignee) {
        console.log("Assignee not found:", assigneeId);
        return NextResponse.json(
          { error: "Assignee not found" },
          { status: 404 }
        );
      }
    }

    // Create bug
    const bug = await prisma.bug.create({
      data: {
        title,
        description,
        stepsToReproduce,
        priority: priority || "MEDIUM",
        severity: severity || "MAJOR",
        projectId,
        reporterId,
        assigneeId,
        status: "OPEN",
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        reporter: {
          select: {
            name: true,
          },
        },
        assignee: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log("Bug created successfully:", bug);

    // Handle file uploads
    if (files.length > 0) {
      try {
        console.log("Processing file uploads...");
        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const uploadPromises = files.map(async (file) => {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Create a unique filename
          const uniqueSuffix = `${Date.now()}-${Math.round(
            Math.random() * 1e9
          )}`;
          const filename = `${uniqueSuffix}-${file.name}`;

          // Save file to uploads directory
          const filePath = join(uploadDir, filename);
          await writeFile(filePath, buffer);

          console.log("File saved:", filename);

          // Create attachment record
          return prisma.attachment.create({
            data: {
              filename,
              fileUrl: `/uploads/${filename}`,
              bugId: bug.id,
              fileType: file.type || "application/octet-stream",
            },
          });
        });

        const attachments = await Promise.all(uploadPromises);
        console.log("File uploads completed:", attachments);
      } catch (error) {
        console.error("Error handling file uploads:", error);
        // Don't fail the entire request if file upload fails
        // Just log the error and continue
      }
    }

    // Create activity
    await prisma.activity.create({
      data: {
        action: "created this bug",
        bugId: bug.id,
        userId: reporterId,
      },
    });

    return NextResponse.json({ bug }, { status: 201 });
  } catch (error) {
    console.error("Error creating bug:", error);
    return NextResponse.json(
      { error: "Failed to create bug", details: String(error) },
      { status: 500 }
    );
  }
}

const users = await prisma.user.findMany({
  include: {
    projects: true,
    assignedBugs: true,
    reportedBugs: true,
  },
});
// Then, for each user:
const userData = users.map((user) => ({
  ...user,
  projectCount: user.projects.length,
  assignedBugCount: user.assignedBugs.length,
  reportedBugCount: user.reportedBugs.length,
}));
