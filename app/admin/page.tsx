"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PACKAGES } from "@/lib/types";
import type { Order } from "@/lib/types";

interface CodeStats {
  total: number;
  used: number;
  remaining: number;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [codeStats, setCodeStats] = useState<CodeStats | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const prevOrderCount = useRef(0);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/codes");
      const data = await res.json();
      setCodeStats(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchStats]);

  // Sound alert on new orders
  useEffect(() => {
    const newCount = orders.filter((o) => o.status === "new").length;
    if (newCount > prevOrderCount.current && prevOrderCount.current > 0) {
      // Play a simple beep using Web Audio
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          osc2.connect(gain);
          osc2.frequency.value = 1100;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.15);
        }, 150);
      } catch {}
    }
    prevOrderCount.current = newCount;
  }, [orders]);

  const generateCodes = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });
      const data = await res.json();
      setNewCodes(data.codes);
      fetchStats();
    } catch {} finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchOrders();
  };

  const newOrders = orders.filter((o) => o.status === "new");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-amber-600 text-white";
      case "prepping": return "bg-blue-600 text-white";
      case "ready": return "bg-green-600 text-white";
      case "picked_up": return "bg-stone-600 text-stone-300";
      default: return "bg-stone-600";
    }
  };

  const getPkgName = (id: string) => PACKAGES.find((p) => p.id === id)?.name || id;

  return (
    <main className="min-h-screen bg-stone-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-amber-400 font-mono">🍋 Orders</h1>
            <p className="text-stone-500 text-sm">
              {newOrders.length} new order{newOrders.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Code management */}
          <div className="text-right">
            {codeStats && (
              <p className="text-stone-400 text-xs mb-2">
                {codeStats.remaining} codes remaining / {codeStats.total} total
              </p>
            )}
            <button
              onClick={generateCodes}
              disabled={generating}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-500 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate 10 Codes"}
            </button>
          </div>
        </div>

        {/* New codes display */}
        {newCodes.length > 0 && (
          <div className="bg-stone-800 border border-amber-500 rounded-lg p-4 mb-6">
            <h3 className="text-amber-400 font-mono text-sm mb-2">New Codes (copy these):</h3>
            <div className="flex flex-wrap gap-2">
              {newCodes.map((code) => (
                <code
                  key={code}
                  className="bg-stone-700 text-white px-3 py-1 rounded text-sm font-mono"
                >
                  {code}
                </code>
              ))}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newCodes.join("\n"));
                setNewCodes([]);
              }}
              className="mt-3 text-xs text-amber-400 hover:text-amber-300"
            >
              Copy all & dismiss
            </button>
          </div>
        )}

        {/* Orders list */}
        {loading ? (
          <p className="text-stone-400 text-center py-8">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🍋</p>
            <p className="text-stone-400">No orders yet</p>
            <p className="text-stone-500 text-sm mt-1">
              Generate codes and share the game URL with your customers
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`bg-stone-800 rounded-lg p-4 border ${
                  order.status === "new" ? "border-amber-500" : "border-stone-700"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-amber-400 font-mono text-sm">{order.id}</span>
                    <span className="text-stone-500 text-xs ml-3">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex gap-4 mb-3">
                  <div className="flex-1">
                    <p className="text-stone-400 text-xs mb-1">Package</p>
                    <p className="text-white text-sm">
                      {getPkgName(order.package)} — ${order.total}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-400 text-xs mb-1">ETA</p>
                    <p className="text-white text-sm">{order.eta}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-stone-400 text-xs mb-1">Flavors</p>
                  <div className="flex flex-wrap gap-2">
                    {order.flavors.map((f, i) => (
                      <span key={i} className="bg-stone-700 text-stone-300 text-xs px-2 py-1 rounded">
                        {f.glasses}x {f.flavor}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === "new" && (
                    <button
                      onClick={() => updateStatus(order.id, "prepping")}
                      className="text-xs bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Start Prepping
                    </button>
                  )}
                  {order.status === "prepping" && (
                    <button
                      onClick={() => updateStatus(order.id, "ready")}
                      className="text-xs bg-green-700 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === "ready" && (
                    <button
                      onClick={() => updateStatus(order.id, "picked_up")}
                      className="text-xs bg-stone-700 text-white px-3 py-1 rounded hover:bg-stone-600"
                    >
                      Picked Up
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
