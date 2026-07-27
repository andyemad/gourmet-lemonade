"use client";

import { useState, useEffect, useCallback } from "react";
import Game from "@/components/Game";
import {
  PackageModal,
  FlavorModal,
  ETAModal,
  ConfirmModal,
  SuccessModal,
} from "@/components/Modals";
import type { PackageTier, FlavorAssignment } from "@/lib/types";
import { PACKAGES } from "@/lib/types";
import { playClick, playConfirm, playSuccess, playError } from "@/lib/sounds";

type Step = "game" | "package" | "flavor" | "eta" | "confirm" | "success";

// Order tracking identifier for a customer session — no accounts, no login.
function sessionId(): string {
  if (typeof window === "undefined") return "GUEST-SSR";
  let id = sessionStorage.getItem("lemonade_session");
  if (!id) {
    id = "GUEST-" + Date.now().toString(36).toUpperCase();
    sessionStorage.setItem("lemonade_session", id);
  }
  return id;
}

export default function Home() {
  const [step, setStep] = useState<Step>("game");
  const [selectedPkg, setSelectedPkg] = useState<PackageTier | null>(null);
  const [flavors, setFlavors] = useState<FlavorAssignment[]>([]);
  const [eta, setEta] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handler = () => {
      playConfirm();
      setStep("package");
    };
    window.addEventListener("open-package-modal", handler);
    return () => window.removeEventListener("open-package-modal", handler);
  }, []);

  const handleSelectPackage = useCallback((pkg: PackageTier) => {
    playClick();
    setSelectedPkg(pkg);
    setStep("flavor");
  }, []);

  const handleConfirmFlavors = useCallback((assignments: FlavorAssignment[]) => {
    playClick();
    setFlavors(assignments);
    setStep("eta");
  }, []);

  const handleConfirmEta = useCallback((etaVal: string) => {
    playClick();
    setEta(etaVal);
    setStep("confirm");
  }, []);

  const handleSubmitOrder = useCallback(async () => {
    if (!selectedPkg || !flavors.length || !eta) return;

    setLoading(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sessionId(), package: selectedPkg, flavors, eta }),
      });
      const data = await res.json();

      if (data.success) {
        setOrderId(data.orderId);
        setStep("success");
        playSuccess();
        (window as Window & { __celebrateLemonade?: () => void }).__celebrateLemonade?.();
      } else {
        playError();
        alert(data.error || "Failed to place order");
      }
    } catch {
      playError();
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedPkg, flavors, eta]);

  const handleDone = useCallback(() => {
    sessionStorage.clear();
    setStep("game");
    setSelectedPkg(null);
    setFlavors([]);
    setEta("");
    setOrderId("");
    setLoading(false);
  }, []);

  const pkg = selectedPkg ? PACKAGES.find((p) => p.id === selectedPkg)! : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#1b1410] p-4">
      <header className="text-center">
        <h1
          className="text-[15px] leading-relaxed text-lemon"
          style={{ fontFamily: "var(--font-pixel)", textShadow: "2px 2px 0 #3a2718" }}
        >
          GOURMET LEMONADE
        </h1>
        <p className="mt-2 text-[11px] text-stone-500">
          Walk up to the stand and place a real order.
        </p>
      </header>

      <Game />

      {step === "package" && (
        <PackageModal onSelect={handleSelectPackage} onClose={() => setStep("game")} />
      )}

      {step === "flavor" && pkg && (
        <FlavorModal
          glasses={pkg.glasses}
          onConfirm={handleConfirmFlavors}
          onBack={() => setStep("package")}
        />
      )}

      {step === "eta" && (
        <ETAModal onConfirm={handleConfirmEta} onBack={() => setStep("flavor")} />
      )}

      {step === "confirm" && pkg && (
        <ConfirmModal
          pkg={pkg.id}
          flavors={flavors}
          eta={eta}
          total={pkg.price}
          onSubmit={handleSubmitOrder}
          onBack={() => setStep("eta")}
          loading={loading}
        />
      )}

      {step === "success" && (
        <SuccessModal orderId={orderId} eta={eta} onDone={handleDone} />
      )}
    </main>
  );
}
