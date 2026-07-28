"use client";

import { useState } from "react";
import {
  BATCH_PRICE,
  ETA_PRESETS,
  FLAVORS,
  MAX_CUSTOM_QUANTITY,
  PACKAGES,
  etaLabel,
  getPackageInfo,
  type FlavorAssignment,
  type FlavorName,
  type PackageInfo,
} from "@/lib/types";

// Modals are mounted only while open (see app/page.tsx), so each one starts
// with fresh state and none of them call hooks conditionally.

/** Keep flavor allocation compatible with any future fractional serving tier. */
function stepFor(glasses: number) {
  return Number.isInteger(glasses) ? 1 : 0.5;
}

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

// ── Shared chrome ────────────────────────────────────────────────────────────

function Lemon({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-3 w-4 shrink-0 border-2 border-ink bg-lemon ${className}`}
      style={{ boxShadow: "inset 1px 1px 0 0 #fff3b0" }}
    />
  );
}

function Panel({
  title, subtitle, children, wide = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#160e07]/85 p-4">
      <div className={`panel panel-pop my-auto w-full ${wide ? "max-w-md" : "max-w-sm"}`}>
        <div className="panel-header px-4 py-3">
          <h2
            className="flex items-center gap-2 text-[13px] leading-relaxed text-[#fff6dd]"
            style={{ fontFamily: "var(--font-pixel)", textShadow: "2px 2px 0 #3a2718" }}
          >
            <Lemon />
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1.5 text-[11px] text-[#f5e6c8]/85">{subtitle}</p>
          )}
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Button({
  children, onClick, disabled, variant = "wood", className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "wood" | "lemon" | "leaf";
  className?: string;
}) {
  const tone = {
    wood: "bg-wood text-[#2b1c10]",
    lemon: "bg-lemon text-[#4a3208]",
    leaf: "bg-leaf text-white",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`pixel-btn ${tone} px-4 py-3 text-[10px] leading-none ${className}`}
      style={{ fontFamily: "var(--font-pixel)" }}
    >
      {children}
    </button>
  );
}

// ── Package selection ────────────────────────────────────────────────────────

export function PackageModal({
  onSelect, onClose,
}: {
  onSelect: (pkg: PackageInfo) => void;
  onClose: () => void;
}) {
  const [customQuantity, setCustomQuantity] = useState("");
  const parsedQuantity = Number(customQuantity);
  const customIsValid =
    Number.isInteger(parsedQuantity) &&
    parsedQuantity >= 1 &&
    parsedQuantity <= MAX_CUSTOM_QUANTITY;

  return (
    <Panel title="THE MENU" subtitle="Each batch serves 7 glasses. Choose a quantity.">
      <div className="mb-4 space-y-2">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onSelect(pkg)}
            className="pixel-card flex w-full items-center justify-between gap-3 bg-[#fffaf0] px-3 py-2.5 text-left"
          >
            <span className="flex items-center gap-2.5">
              <Lemon />
              <span>
                <span
                  className="block text-[10px] leading-none text-ink"
                  style={{ fontFamily: "var(--font-pixel)" }}
                >
                  {pkg.name}
                </span>
                <span className="mt-1.5 block text-[11px] text-[#7a6244]">{pkg.label}</span>
              </span>
            </span>
            <span
              className="shrink-0 border-2 border-ink bg-lemon px-2 py-1 text-[11px] leading-none text-[#4a3208]"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              ${pkg.price}
            </span>
          </button>
        ))}

        <div className="border-[3px] border-ink bg-[#fffaf0] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="custom-quantity"
              className="text-[10px] leading-none text-ink"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              CUSTOM QUANTITY
            </label>
            <span className="text-[11px] text-[#7a6244]">${BATCH_PRICE} each</span>
          </div>
          <div className="flex gap-2">
            <input
              id="custom-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_CUSTOM_QUANTITY}
              step={1}
              value={customQuantity}
              onChange={(event) => setCustomQuantity(event.target.value)}
              placeholder="5"
              aria-label="Custom batch quantity"
              className="min-w-0 flex-1 border-[3px] border-ink bg-white px-3 py-2 text-[12px] text-ink outline-none focus:bg-[#fff8cf]"
            />
            <Button
              variant="lemon"
              disabled={!customIsValid}
              onClick={() => onSelect(getPackageInfo("custom", parsedQuantity))}
            >
              {customIsValid ? `$${parsedQuantity * BATCH_PRICE}` : "Select"}
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-[#7a6244]">
            Enter 1–{MAX_CUSTOM_QUANTITY} batches.
          </p>
        </div>
      </div>
      <Button onClick={onClose} className="w-full">Never mind</Button>
    </Panel>
  );
}

// ── Flavor assignment ────────────────────────────────────────────────────────

export function FlavorModal({
  glasses, onConfirm, onBack,
}: {
  glasses: number;
  onConfirm: (assignments: FlavorAssignment[]) => void;
  onBack: () => void;
}) {
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(FLAVORS.map((f) => [f, 0])),
  );

  const step = stepFor(glasses);
  const assigned = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const remaining = Math.round((glasses - assigned) * 10) / 10;
  const complete = remaining === 0;

  const bump = (flavor: string, delta: number) =>
    setCounts((prev) => ({
      ...prev,
      [flavor]: Math.round(Math.max(0, prev[flavor] + delta) * 10) / 10,
    }));

  return (
    <Panel title="PICK FLAVORS" subtitle={`Split ${fmt(glasses)} glasses however you like.`}>
      {/* A jar filling up, rather than a progress bar. */}
      <div className="mb-2 h-5 border-[3px] border-ink bg-[#e6dcc4] p-0.5">
        <div
          className="h-full bg-lemon transition-[width] duration-150"
          style={{
            width: `${Math.min(100, (assigned / glasses) * 100)}%`,
            boxShadow: "inset 0 3px 0 0 #fff3b0",
          }}
        />
      </div>
      <p className="mb-4 text-center text-[11px] text-[#7a6244]">
        {complete
          ? "All glasses assigned — nice."
          : `${fmt(assigned)} of ${fmt(glasses)} assigned · ${fmt(remaining)} to go`}
      </p>

      <div className="mb-4 space-y-2">
        {FLAVORS.map((flavor) => (
          <div
            key={flavor}
            className="flex items-center justify-between gap-2 border-[3px] border-ink bg-[#fffaf0] px-3 py-2"
          >
            <span className="text-[12px] leading-snug text-ink">{flavor}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                aria-label={`Remove a glass of ${flavor}`}
                onClick={() => bump(flavor, -step)}
                disabled={counts[flavor] === 0}
                className="pixel-btn h-8 w-8 bg-berry text-[12px] leading-none text-white"
              >
                −
              </button>
              <span
                className="w-8 text-center text-[11px] text-ink"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                {fmt(counts[flavor])}
              </span>
              <button
                type="button"
                aria-label={`Add a glass of ${flavor}`}
                onClick={() => bump(flavor, step)}
                disabled={remaining < step}
                className="pixel-btn h-8 w-8 bg-leaf text-[12px] leading-none text-white"
              >
                +
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={onBack} className="flex-1">Back</Button>
        <Button
          variant="lemon"
          className="flex-1"
          disabled={!complete}
          onClick={() =>
            onConfirm(
              FLAVORS.filter((f) => counts[f] > 0).map((f) => ({
                flavor: f as FlavorName,
                glasses: counts[f],
              })),
            )
          }
        >
          Next
        </Button>
      </div>
    </Panel>
  );
}

// ── Pickup time ──────────────────────────────────────────────────────────────

export function ETAModal({
  onConfirm, onBack,
}: {
  onConfirm: (eta: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("");
  const customSelected = selected === "custom";
  const canContinue = Boolean(selected) && (!customSelected || Boolean(customTime.trim()));

  return (
    <Panel title="PICKUP TIME" subtitle="When are you swinging by the stand?">
      <div className="mb-4 grid grid-cols-2 gap-2">
        {ETA_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            data-selected={selected === preset.value}
            onClick={() => setSelected(preset.value)}
            className={`pixel-card px-3 py-3 text-[10px] leading-none ${
              selected === preset.value
                ? "bg-lemon text-[#4a3208]"
                : "bg-[#fffaf0] text-ink"
            }`}
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          data-selected={customSelected}
          onClick={() => setSelected("custom")}
          className={`pixel-card px-3 py-3 text-[10px] leading-none ${
            customSelected ? "bg-lemon text-[#4a3208]" : "bg-[#fffaf0] text-ink"
          }`}
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          Custom
        </button>
      </div>
      {customSelected && (
        <div className="mb-4 border-[3px] border-ink bg-[#fffaf0] p-3">
          <label htmlFor="custom-time" className="mb-2 block text-[11px] text-[#7a6244]">
            Tell us your pickup time
          </label>
          <input
            id="custom-time"
            type="text"
            value={customTime}
            onChange={(event) => setCustomTime(event.target.value)}
            maxLength={80}
            placeholder="Example: Around 2:30 PM"
            autoFocus
            className="w-full border-[3px] border-ink bg-white px-3 py-2 text-[12px] text-ink outline-none focus:bg-[#fff8cf]"
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={onBack} className="flex-1">Back</Button>
        <Button
          variant="lemon"
          className="flex-1"
          disabled={!canContinue}
          onClick={() =>
            selected && onConfirm(customSelected ? `custom:${customTime.trim()}` : selected)
          }
        >
          Next
        </Button>
      </div>
    </Panel>
  );
}

// ── Confirmation ─────────────────────────────────────────────────────────────

export function ConfirmModal({
  pkg, flavors, eta, total, onSubmit, onBack, loading,
}: {
  pkg: PackageInfo;
  flavors: FlavorAssignment[];
  eta: string;
  total: number;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  return (
    <Panel title="YOUR ORDER" subtitle="Give it a last look before it hits the stand.">
      <dl className="mb-4 space-y-2 border-[3px] border-ink bg-[#fffaf0] p-3 text-[12px] text-ink">
        <div className="flex justify-between gap-3">
          <dt className="text-[#7a6244]">Package</dt>
          <dd className="text-right font-semibold">
            {pkg.name} · {pkg.quantity} batch{pkg.quantity === 1 ? "" : "es"} · {pkg.label}
          </dd>
        </div>
        <div className="border-t-2 border-dashed border-[#d5c6a8] pt-2">
          <dt className="mb-1 text-[#7a6244]">Flavors</dt>
          {flavors.map((f) => (
            <dd key={f.flavor} className="flex justify-between gap-3">
              <span>{f.flavor}</span>
              <span className="shrink-0 text-[#7a6244]">
                {fmt(f.glasses)} glass{f.glasses === 1 ? "" : "es"}
              </span>
            </dd>
          ))}
        </div>
        <div className="flex justify-between gap-3 border-t-2 border-dashed border-[#d5c6a8] pt-2">
          <dt className="text-[#7a6244]">Pickup</dt>
          <dd className="font-semibold">{etaLabel(eta)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t-[3px] border-ink pt-2">
          <dt className="text-[#7a6244]">Total</dt>
          <dd
            className="border-2 border-ink bg-lemon px-2 py-1 text-[12px] leading-none text-[#4a3208]"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            ${total}.00
          </dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <Button onClick={onBack} disabled={loading} className="flex-1">Back</Button>
        <Button variant="leaf" className="flex-1" disabled={loading} onClick={onSubmit}>
          {loading ? "Sending…" : "Place order"}
        </Button>
      </div>
    </Panel>
  );
}

// ── Success ──────────────────────────────────────────────────────────────────

export function SuccessModal({
  orderId, eta, onDone,
}: {
  orderId: string;
  eta: string;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#160e07]/92 p-4">
      <div className="panel panel-pop w-full max-w-sm text-center">
        <div className="panel-header px-4 py-3">
          <h2
            className="text-[13px] leading-relaxed text-[#fff6dd]"
            style={{ fontFamily: "var(--font-pixel)", textShadow: "2px 2px 0 #3a2718" }}
          >
            ORDER PLACED!
          </h2>
        </div>
        <div className="p-6">
          <div className="mb-4 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-6 w-8 border-[3px] border-ink bg-lemon"
                style={{
                  boxShadow: "inset 2px 2px 0 0 #fff3b0",
                  animation: `panel-pop 260ms steps(4) ${i * 90}ms both`,
                }}
              />
            ))}
          </div>
          <p className="mb-1 text-[12px] text-ink">
            Ready in <span className="font-bold">{etaLabel(eta)}</span>
          </p>
          <p className="mb-5 font-mono text-[11px] text-[#7a6244]">{orderId}</p>
          <p className="mb-5 text-[11px] text-[#7a6244]">
            The stand has your order. This session resets now.
          </p>
          <Button variant="leaf" onClick={onDone} className="w-full">
            Back to the stand
          </Button>
        </div>
      </div>
    </div>
  );
}
