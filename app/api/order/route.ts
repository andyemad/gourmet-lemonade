import { NextRequest, NextResponse } from "next/server";
import { saveOrder } from "@/lib/orders";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, package: pkg, quantity, flavors, eta } = body;

    if (!code || !pkg || !flavors || !eta) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(flavors) || flavors.length === 0) {
      return NextResponse.json(
        { error: "At least one flavor is required" },
        { status: 400 }
      );
    }

    if (typeof eta !== "string" || eta.length > 100) {
      return NextResponse.json({ error: "Invalid pickup time" }, { status: 400 });
    }

    const order = await saveOrder({ code, package: pkg, quantity, flavors, eta });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    console.error("Order error:", err);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
