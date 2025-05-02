import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bugId = params.id;
    const formData = await req.formData();
    const files = formData.getAll("files");

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "bugs", bugId);
    await mkdir(uploadDir, { recursive: true });

    // Process each file
    for (const file of files) {
      if (file instanceof File) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = join(uploadDir, fileName);

        // Save file to disk
        await writeFile(filePath, buffer);

        // Create attachment record in database
        await prisma.attachment.create({
          data: {
            name: file.name,
            path: `/uploads/bugs/${bugId}/${fileName}`,
            size: file.size,
            type: file.type,
            bugId: bugId,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error uploading attachments:", error);
    return NextResponse.json(
      { error: "Failed to upload attachments" },
      { status: 500 }
    );
  }
}
