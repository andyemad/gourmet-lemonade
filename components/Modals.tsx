"use client";

import { PACKAGES, FLAVORS, type PackageTier, type FlavorName, type FlavorAssignment } from "@/lib/types";
import { useState } from "react";

// ── Package Selection Modal ──

interface PackageModalProps {
  isOpen: boolean;
  onSelect: (pkg: PackageTier) => void;
  onClose: () => void;
}

export function PackageModal({ isOpen, onSelect, onClose }: PackageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border-2 border-amber-500 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-amber-400 font-mono mb-1">Choose Your Package</h2>
        <p className="text-stone-400 text-xs mb-4">Gourmet small-batch lemonade</p>

        <div className="space-y-2 mb-4">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className="w-full bg-stone-700 hover:bg-stone-600 border border-stone-600 hover:border-amber-500 rounded-lg p-3 text-left transition-all flex justify-between items-center"
            >
              <div>
                <div className="text-white font-medium text-sm">{pkg.name}</div>
                <div className="text-stone-400 text-xs">{pkg.label}</div>
              </div>
              <div className="text-amber-400 font-bold text-lg">${pkg.price}</div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-stone-600 text-white py-2 rounded-lg text-sm hover:bg-stone-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Flavor Assignment Modal ──

interface FlavorModalProps {
  isOpen: boolean;
  pkg: PackageTier;
  glasses: number;
  onConfirm: (assignments: FlavorAssignment[]) => void;
  onBack: () => void;
}

export function FlavorModal({ isOpen, pkg, glasses, onConfirm, onBack }: FlavorModalProps) {
  if (!isOpen) return null;

  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(FLAVORS.map((f) => [f, 0]))
  );

  const totalAssigned = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const remaining = glasses - totalAssigned;
  const isComplete = remaining === 0;

  const increment = (flavor: string) => {
    if (totalAssigned >= glasses) return;
    setCounts((prev) => ({ ...prev, [flavor]: prev[flavor] + 1 }));
  };

  const decrement = (flavor: string) => {
    setCounts((prev) => ({ ...prev, [flavor]: Math.max(0, prev[flavor] - 1) }));
  };

  const handleConfirm = () => {
    const assignments: FlavorAssignment[] = FLAVORS
      .filter((f) => counts[f] > 0)
      .map((f) => ({ flavor: f as FlavorName, glasses: counts[f] }));
    onConfirm(assignments);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border-2 border-amber-500 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-amber-400 font-mono mb-1">Pick Your Flavors</h2>
        <p className="text-stone-400 text-xs mb-2">
          Assign {glasses} glasses across flavors
        </p>

        {/* Progress */}
        <div className="w-full bg-stone-700 rounded-full h-2 mb-4">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all"
            style={{ width: `${(totalAssigned / glasses) * 100}%` }}
          />
        </div>
        <p className="text-center text-stone-400 text-xs mb-4">
          {totalAssigned} of {glasses} assigned
          {remaining > 0 && ` (${remaining} remaining)`}
        </p>

        <div className="space-y-2 mb-4">
          {FLAVORS.map((flavor) => (
            <div
              key={flavor}
              className="flex items-center justify-between bg-stone-700 rounded-lg p-2"
            >
              <span className="text-white text-sm">{flavor}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => decrement(flavor)}
                  disabled={counts[flavor] === 0}
                  className="w-7 h-7 bg-stone-600 text-white rounded text-sm hover:bg-stone-500 disabled:opacity-30"
                >
                  −
                </button>
                <span className="text-white w-4 text-center text-sm">{counts[flavor]}</span>
                <button
                  onClick={() => increment(flavor)}
                  disabled={totalAssigned >= glasses}
                  className="w-7 h-7 bg-stone-600 text-white rounded text-sm hover:bg-stone-500 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 bg-stone-600 text-white py-2 rounded-lg text-sm hover:bg-stone-500"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isComplete}
            className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ETA Modal ──

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border-2 border-amber-500 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-amber-400 font-mono mb-1">Pickup Time</h2>
        <p className="text-stone-400 text-xs mb-4">When will you arrive?</p>

        <div className="space-y-2 mb-4">
          {ETA_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setSelected(preset.value)}
              className={`w-full rounded-lg p-3 text-left text-sm transition-all ${
                selected === preset.value
                  ? "bg-amber-600 text-white border-amber-400"
                  : "bg-stone-700 text-stone-300 border-stone-600 hover:border-amber-500"
              } border`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 bg-stone-600 text-white py-2 rounded-lg text-sm hover:bg-stone-500"
          >
            Back
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Modal ──

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

export function ConfirmModal({
  isOpen,
  pkg,
  flavors,
  eta,
  total,
  onSubmit,
  onBack,
  loading,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const pkgInfo = PACKAGES.find((p) => p.id === pkg)!;
  const etaLabel = ETA_PRESETS.find((p) => p.value === eta)?.label || eta;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border-2 border-amber-500 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-amber-400 font-mono mb-1">Confirm Order</h2>
        <p className="text-stone-400 text-xs mb-4">Review before placing</p>

        <div className="bg-stone-700 rounded-lg p-3 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-400">Package</span>
            <span className="text-white">{pkgInfo.name} ({pkgInfo.label})</span>
          </div>

          <div className="border-t border-stone-600 pt-2">
            <span className="text-stone-400 block mb-1">Flavors</span>
            {flavors.map((f, i) => (
              <div key={i} className="flex justify-between text-white">
                <span>{f.flavor}</span>
                <span className="text-stone-400">{f.glasses} glass{f.glasses !== 1 ? "es" : ""}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-600 pt-2 flex justify-between">
            <span className="text-stone-400">Pickup</span>
            <span className="text-white">{etaLabel}</span>
          </div>

          <div className="border-t border-stone-600 pt-2 flex justify-between">
            <span className="text-stone-400">Total</span>
            <span className="text-amber-400 font-bold text-lg">${total}.00</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex-1 bg-stone-600 text-white py-2 rounded-lg text-sm hover:bg-stone-500 disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-amber-500 disabled:opacity-50"
          >
            {loading ? "Placing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Success Modal ──

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-800 border-2 border-green-500 rounded-xl p-6 w-full max-w-sm text-center">
        <div className="text-5xl mb-3">🍋</div>
        <h2 className="text-xl font-bold text-green-400 font-mono mb-1">Order Confirmed!</h2>
        <p className="text-stone-400 text-xs mb-1">{orderId}</p>
        <p className="text-stone-300 text-sm mb-4">
          Your gourmet lemonade will be ready at <span className="text-amber-400">{etaLabel}</span>
        </p>
        <button
          onClick={onDone}
          className="w-full bg-green-700 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-600"
        >
          Done
        </button>
      </div>
    </div>
  );
}
