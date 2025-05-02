import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { content, bugId, userId } = await req.json()

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        bugId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create activity
    await prisma.activity.create({
      data: {
        action: "added comment",
        bugId,
        userId,
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
