import { NextRequest, NextResponse } from "next/server";
import { validateCode } from "@/lib/codes";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, reason: "Code is required" },
        { status: 400 }
      );
    }

    const result = await validateCode(code);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Validate code error:", err);
    return NextResponse.json(
      { valid: false, reason: "Server error" },
      { status: 500 }
    );
  }
}
