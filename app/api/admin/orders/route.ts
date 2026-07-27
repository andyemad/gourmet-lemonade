import { NextRequest, NextResponse } from "next/server";
import { getOrders, updateOrderStatus } from "@/lib/orders";

export async function GET() {
  try {
    const orders = await getOrders(50);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Get orders error:", err);
    return NextResponse.json(
      { error: "Failed to get orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status required" },
        { status: 400 }
      );
    }

    await updateOrderStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
