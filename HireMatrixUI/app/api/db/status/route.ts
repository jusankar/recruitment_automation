import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      connected: true,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        connected: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}
