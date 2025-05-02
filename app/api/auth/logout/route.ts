import { NextResponse } from "next/server"

export async function GET() {
  // Create a response that will redirect to the login page
  const response = NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"))

  // Clear the auth token cookie
  response.cookies.delete("token")

  return response
}
