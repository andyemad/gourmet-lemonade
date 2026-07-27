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

// Generate a session identifier for order tracking (no auth required)
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

  // Listen for game events
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
        body: JSON.stringify({
          code: sessionId(),
          package: selectedPkg,
          flavors,
          eta,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOrderId(data.orderId);
        setStep("success");
        playSuccess();
        try {
          (window as any).__celebrateLemonade?.();
        } catch {}
      } else {
        playError();
        alert(data.error || "Failed to place order");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedPkg, flavors, eta]);

  const handleDone = useCallback(() => {
    // Full wipe, back to game
    sessionStorage.clear();
    setStep("game");
    setSelectedPkg(null);
    setFlavors([]);
    setEta("");
    setOrderId("");
    setLoading(false);
  }, []);

  const pkgGlasses = selectedPkg
    ? PACKAGES.find((p) => p.id === selectedPkg)!.glasses
    : 0;
  const pkgTotal = selectedPkg
    ? PACKAGES.find((p) => p.id === selectedPkg)!.price
    : 0;

  return (
    <>
      {step !== "success" && (
        <main className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-amber-400 font-mono mb-1">
            🍋 Gourmet Lemonade
          </h1>
          <p className="text-stone-500 text-xs mb-4">
            Walk up to the stand → Press SPACE → Order
          </p>

          {step === "game" && <Game accessCode={sessionId()} />}

          <PackageModal
            isOpen={step === "package"}
            onSelect={handleSelectPackage}
            onClose={() => setStep("game")}
          />

          <FlavorModal
            isOpen={step === "flavor"}
            pkg={selectedPkg!}
            glasses={pkgGlasses}
            onConfirm={handleConfirmFlavors}
            onBack={() => setStep("package")}
          />

          <ETAModal
            isOpen={step === "eta"}
            onConfirm={handleConfirmEta}
            onBack={() => setStep("flavor")}
          />

          <ConfirmModal
            isOpen={step === "confirm"}
            pkg={selectedPkg!}
            flavors={flavors}
            eta={eta}
            total={pkgTotal}
            onSubmit={handleSubmitOrder}
            onBack={() => setStep("eta")}
            loading={loading}
          />
        </main>
      )}

      <SuccessModal
        isOpen={step === "success"}
        orderId={orderId}
        eta={eta}
        onDone={handleDone}
      />
    </>
  );
}
