import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile, isValidFileType, isValidFileSize } from "@/lib/uploadFile";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const bugId = formData.get("bugId") as string;
    const file = formData.get("file") as File;

    if (!bugId || !file) {
      return NextResponse.json(
        { error: "Bug ID and file are required" },
        { status: 400 }
      );
    }

    // Validate file type and size
    if (!isValidFileType(file)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (!isValidFileSize(file)) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Check if bug exists
    const bug = await prisma.bug.findUnique({
      where: { id: bugId },
    });

    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    // Upload file and get URL
    const fileUrl = await uploadFile(file, bugId);

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        fileType: file.type,
        fileUrl,
        bugId,
      },
    });

    // Create activity for the attachment
    await prisma.activity.create({
      data: {
        action: `added attachment: ${file.name}`,
        bugId,
        userId: req.headers.get("x-user-id") || "", // From auth middleware
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error("Error handling attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}
