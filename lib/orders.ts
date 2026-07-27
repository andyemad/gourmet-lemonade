import { kv } from "./kv";
import type { Order, PackageTier, FlavorAssignment } from "./types";
import { PACKAGES } from "./types";

export async function saveOrder(params: {
  code: string;
  package: PackageTier;
  flavors: FlavorAssignment[];
  eta: string;
}): Promise<Order> {
  const pkg = PACKAGES.find((p) => p.id === params.package);
  if (!pkg) throw new Error(`Invalid package: ${params.package}`);

  const order: Order = {
    id: `ORD-${Date.now().toString(36).toUpperCase()}`,
    code: params.code,
    package: params.package,
    flavors: params.flavors,
    eta: params.eta,
    total: pkg.price,
    status: "new",
    createdAt: Date.now(),
  };

  // Store with 30-day TTL
  await kv.set(`order:${order.id}`, order, { ex: 2592000 });
  await kv.lpush("orders", order.id);

  return order;
}

export async function getOrders(limit = 50): Promise<Order[]> {
  const ids = await kv.lrange("orders", 0, limit - 1);
  if (!ids.length) return [];

  const pipe = kv.pipeline();
  (ids as string[]).forEach((id) => pipe.get(`order:${id}`));
  const results = await pipe.exec();

  return results.filter(Boolean) as Order[];
}

export async function updateOrderStatus(
  id: string,
  status: "prepping" | "ready" | "picked_up"
): Promise<void> {
  const order = await kv.get(`order:${id}`) as Order | null;
  if (!order) throw new Error(`Order not found: ${id}`);

  order.status = status;
  await kv.set(`order:${id}`, order, { ex: 2592000 });
}
