import { NextRequest, NextResponse } from "next/server";
import { generateCodes, getCodeStats } from "@/lib/codes";

export async function POST(req: NextRequest) {
  try {
    const { count } = await req.json();
    const n = Math.min(Math.max(count || 10, 1), 50); // clamp 1-50
    const codes = await generateCodes(n);
    return NextResponse.json({ codes });
  } catch (err) {
    console.error("Generate codes error:", err);
    return NextResponse.json(
      { error: "Failed to generate codes" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await getCodeStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Code stats error:", err);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
