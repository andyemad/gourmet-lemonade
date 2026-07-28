// Shared types and pricing rules for the gourmet lemonade ordering system

export type PackageTier =
  | "taster"
  | "weekender"
  | "half_case"
  | "full_case"
  | "custom";

export interface PackageInfo {
  id: PackageTier;
  name: string;
  quantity: number;
  glasses: number;
  price: number;
  label: string;
}

export const BATCH_PRICE = 60;
export const GLASSES_PER_BATCH = 7;
export const MAX_CUSTOM_QUANTITY = 99;

export const PACKAGES: PackageInfo[] = [
  { id: "taster", name: "Single Batch", quantity: 1, glasses: 7, price: 60, label: "7 Glasses" },
  { id: "weekender", name: "Double Batch", quantity: 2, glasses: 14, price: 120, label: "14 Glasses" },
  { id: "half_case", name: "Triple Batch", quantity: 3, glasses: 21, price: 180, label: "21 Glasses" },
  { id: "full_case", name: "Four Batches", quantity: 4, glasses: 28, price: 240, label: "28 Glasses" },
];

export function getPackageInfo(
  id: PackageTier,
  customQuantity?: number,
): PackageInfo {
  if (id !== "custom") {
    const preset = PACKAGES.find((pkg) => pkg.id === id);
    if (!preset) throw new Error(`Invalid package: ${id}`);
    return preset;
  }

  if (
    !Number.isInteger(customQuantity) ||
    !customQuantity ||
    customQuantity < 1 ||
    customQuantity > MAX_CUSTOM_QUANTITY
  ) {
    throw new Error("Invalid custom quantity");
  }

  const quantity = customQuantity;
  const glasses = quantity * GLASSES_PER_BATCH;
  return {
    id: "custom",
    name: "Custom Order",
    quantity,
    glasses,
    price: quantity * BATCH_PRICE,
    label: `${glasses} Glasses`,
  };
}

export const ETA_PRESETS = [
  { label: "Less than 15 minutes", value: "under_15m" },
  { label: "20 minutes", value: "20m" },
  { label: "30 minutes", value: "30m" },
  { label: "45 minutes", value: "45m" },
  { label: "1 hr +", value: "1h_plus" },
] as const;

export function etaLabel(value: string): string {
  if (value.startsWith("custom:")) return value.slice("custom:".length);
  return ETA_PRESETS.find((preset) => preset.value === value)?.label ?? value;
}

export const FLAVORS = [
  "Ice Cream Lemonade",
  "Runts Lemonade",
] as const;

export type FlavorName = (typeof FLAVORS)[number];

export interface FlavorAssignment {
  flavor: FlavorName;
  glasses: number;
}

export interface Order {
  id: string;
  code: string;
  package: PackageTier;
  quantity: number;
  flavors: FlavorAssignment[];
  eta: string;
  total: number;
  status: "new" | "prepping" | "ready" | "picked_up";
  createdAt: number;
}
