import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// Helper function to generate a unique API key
function generateApiKey() {
  return randomBytes(32).toString("hex");
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reqParams = await params;
    const projectId = reqParams.id;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generate a new API key
    const apiKey = generateApiKey();

    // Update the project with the new API key
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { apiKey },
    });

    // Log an activity for the API key regeneration
    console.log("USER", req.headers.get("x-user-id"));
    // await prisma.activity.create({
    //   data: {
    //     action: "regenerated API key for GitHub integration",
    //     projectId,
    //     userId: req.headers.get("x-user-id") || "unknown",
    //   },
    // });

    return NextResponse.json({ apiKey });
  } catch (error) {
    console.error("Error regenerating API key:", error);
    return NextResponse.json(
      { error: "Failed to regenerate API key" },
      { status: 500 }
    );
  }
}
