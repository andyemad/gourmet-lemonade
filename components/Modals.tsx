"use client";

import { PACKAGES, FLAVORS, type PackageTier, type FlavorName, type FlavorAssignment } from "@/lib/types";
import { borderPixel, borderPixelActive, btnPixel, btnPixelPrimary } from "@/lib/pixel-styles";
import { useState } from "react";

const overlayStyle = "fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4";
const cardStyle = `bg-stone-800 ${borderPixel} rounded-sm p-6 w-full max-w-sm`;
const titleStyle = "text-xl font-bold text-amber-400 font-mono mb-1 pixelated";
const subtitleStyle = "text-stone-400 text-xs mb-4";

// ── Package Selection ──

interface PackageModalProps {
  isOpen: boolean;
  onSelect: (pkg: PackageTier) => void;
  onClose: () => void;
}

export function PackageModal({ isOpen, onSelect, onClose }: PackageModalProps) {
  if (!isOpen) return null;

  return (
    <div className={overlayStyle}>
      <div className={cardStyle}>
        <h2 className={titleStyle}>📦 Choose Your Pack</h2>
        <p className={subtitleStyle}>Gourmet small-batch lemonade</p>

        <div className="space-y-2 mb-4">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className={`w-full text-left p-3 bg-stone-700 border-2 border-stone-600 hover:border-amber-500 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all flex justify-between items-center`}
            >
              <div>
                <div className="text-white font-bold text-sm">{pkg.name}</div>
                <div className="text-stone-400 text-xs">{pkg.label}</div>
              </div>
              <div className="text-amber-400 font-bold text-lg">${pkg.price}</div>
            </button>
          ))}
        </div>

        <button onClick={onClose} className={`${btnPixel} w-full text-sm`}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Flavor Assignment ──

interface FlavorModalProps {
  isOpen: boolean;
  pkg: PackageTier;
  glasses: number;
  onConfirm: (assignments: FlavorAssignment[]) => void;
  onBack: () => void;
}

export function FlavorModal({ isOpen, pkg: _pkg, glasses, onConfirm, onBack }: FlavorModalProps) {
  if (!isOpen) return null;

  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(FLAVORS.map((f) => [f, 0]))
  );

  const totalAssigned = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const remaining = glasses - totalAssigned;
  const isComplete = remaining === 0;

  const handleConfirm = () => {
    const assignments: FlavorAssignment[] = FLAVORS
      .filter((f) => counts[f] > 0)
      .map((f) => ({ flavor: f as FlavorName, glasses: counts[f] }));
    onConfirm(assignments);
  };

  return (
    <div className={overlayStyle}>
      <div className={cardStyle}>
        <h2 className={titleStyle}>🍋 Pick Flavors</h2>
        <p className={subtitleStyle}>
          Assign {glasses} glasses across flavors
        </p>

        {/* Progress bar */}
        <div className="w-full bg-stone-700 border-2 border-stone-600 h-4 mb-2 shadow-inner">
          <div
            className="bg-amber-500 h-full transition-all duration-200"
            style={{ width: `${Math.min(100, (totalAssigned / glasses) * 100)}%` }}
          />
        </div>
        <p className="text-center text-stone-400 text-xs mb-4 font-mono">
          {totalAssigned}/{glasses} assigned
          {remaining > 0 && ` — ${remaining} left`}
          {isComplete && " ✅"}
        </p>

        <div className="space-y-2 mb-4">
          {FLAVORS.map((flavor) => (
            <div
              key={flavor}
              className="flex items-center justify-between bg-stone-700 border-2 border-stone-600 p-2"
            >
              <span className="text-white text-sm font-medium">{flavor}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCounts((q) => ({ ...q, [flavor]: Math.max(0, q[flavor] - 1) }))}
                  disabled={counts[flavor] === 0}
                  className="w-8 h-8 bg-stone-600 text-white font-bold border-2 border-stone-500 active:bg-red-700 disabled:opacity-30 transition-colors"
                >
                  −
                </button>
                <span className="text-white w-4 text-center font-mono">{counts[flavor]}</span>
                <button
                  onClick={() => setCounts((q) => ({ ...q, [flavor]: q[flavor] + 1 }))}
                  disabled={totalAssigned >= glasses}
                  className="w-8 h-8 bg-stone-600 text-white font-bold border-2 border-stone-500 active:bg-green-700 disabled:opacity-30 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onBack} className={`${btnPixel} flex-1 text-sm`}>
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isComplete}
            className={`${btnPixelPrimary} flex-1 text-sm`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ETA Selection ──

interface ETAModalProps {
  isOpen: boolean;
  onConfirm: (eta: string) => void;
  onBack: () => void;
}

const ETA_PRESETS = [
  { label: "15 minutes", value: "15m" },
  { label: "30 minutes", value: "30m" },
  { label: "1 hour", value: "1h" },
  { label: "Tomorrow", value: "tomorrow" },
];

export function ETAModal({ isOpen, onConfirm, onBack }: ETAModalProps) {
  if (!isOpen) return null;
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className={overlayStyle}>
      <div className={cardStyle}>
        <h2 className={titleStyle}>⏰ Pickup Time</h2>
        <p className={subtitleStyle}>When will you swing by?</p>

        <div className="space-y-2 mb-4">
          {ETA_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setSelected(preset.value)}
              className={`w-full text-left p-3 border-2 transition-all font-mono ${
                selected === preset.value
                  ? borderPixelActive + " bg-amber-600 text-white"
                  : "bg-stone-700 border-stone-600 text-stone-300 hover:border-amber-500"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onBack} className={`${btnPixel} flex-1 text-sm`}>Back</button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className={`${btnPixelPrimary} flex-1 text-sm`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirmation ──

interface ConfirmModalProps {
  isOpen: boolean;
  pkg: PackageTier;
  flavors: FlavorAssignment[];
  eta: string;
  total: number;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export function ConfirmModal({ isOpen, pkg, flavors, eta, total, onSubmit, onBack, loading }: ConfirmModalProps) {
  if (!isOpen) return null;

  const pkgInfo = PACKAGES.find((p) => p.id === pkg)!;
  const etaLabel = ETA_PRESETS.find((p) => p.value === eta)?.label || eta;

  return (
    <div className={overlayStyle}>
      <div className={cardStyle}>
        <h2 className={titleStyle}>✅ Confirm Order</h2>
        <p className={subtitleStyle}>Review your picks</p>

        <div className="bg-stone-700 border-2 border-stone-600 p-3 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-400">Package</span>
            <span className="text-white font-bold">{pkgInfo.name} ({pkgInfo.label})</span>
          </div>

          <div className="border-t-2 border-stone-600 pt-2">
            <span className="text-stone-400 block mb-1">Flavors</span>
            {flavors.map((f, i) => (
              <div key={i} className="flex justify-between text-white">
                <span>{f.flavor}</span>
                <span className="text-stone-400 font-mono">{f.glasses} glass{f.glasses !== 1 ? "es" : ""}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-stone-600 pt-2 flex justify-between">
            <span className="text-stone-400">Pickup</span>
            <span className="text-white">{etaLabel}</span>
          </div>

          <div className="border-t-2 border-amber-600 pt-2 flex justify-between">
            <span className="text-stone-400">Total</span>
            <span className="text-amber-400 font-bold text-lg">${total}.00</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onBack} disabled={loading} className={`${btnPixel} flex-1 text-sm`}>
            Back
          </button>
          <button onClick={onSubmit} disabled={loading} className={`${btnPixelPrimary} flex-1 text-sm`}>
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Success / Full Reset ──

interface SuccessModalProps {
  isOpen: boolean;
  orderId: string;
  eta: string;
  onDone: () => void;
}

export function SuccessModal({ isOpen, orderId, eta, onDone }: SuccessModalProps) {
  if (!isOpen) return null;

  const etaLabel = ETA_PRESETS.find((p) => p.value === eta)?.label || eta;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className={`bg-stone-800 border-4 border-green-500 shadow-[4px_4px_0px_0px_rgba(0,80,0,0.8)] rounded-sm p-8 w-full max-w-sm text-center`}>
        <div className="text-6xl mb-4 animate-bounce">🍋</div>
        <h2 className="text-2xl font-bold text-green-400 font-mono mb-2">Order Placed!</h2>
        <p className="text-stone-400 text-xs font-mono mb-1">{orderId}</p>
        <p className="text-stone-300 text-sm mb-6">
          Ready at{" "}
          <span className="text-amber-400 font-bold">{etaLabel}</span>
        </p>
        <p className="text-stone-500 text-xs mb-4">
          This session will now reset. Your code has been used.
        </p>
        <button
          onClick={onDone}
          className="w-full bg-green-600 text-white font-bold py-3 border-2 border-green-700 shadow-[3px_3px_0px_0px_rgba(0,60,0,0.6)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
        >
          Close & Reset
        </button>
      </div>
    </div>
  );
}
