import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { sendInviteEmail } from "@/lib/email"; // implement this for real email sending
import { randomBytes } from "crypto";

export async function POST(req) {
  try {
    const { name, email, role } = await req.json();

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Generate invite token
    const inviteToken = randomBytes(32).toString("hex");

    // Create user with INVITED status and token
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        status: "INVITED",
        inviteToken,
      },
    });

    // TODO: Send invite email with link (implement sendInviteEmail)
    // await sendInviteEmail(email, `https://yourapp.com/invite/accept?token=${inviteToken}`);

    return NextResponse.json({ message: "Invite sent", user });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}
