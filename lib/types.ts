// Shared types for the gourmet lemonade ordering system

export type PackageTier = "taster" | "weekender" | "half_case" | "full_case";

export interface PackageInfo {
  id: PackageTier;
  name: string;
  glasses: number;
  price: number;
  label: string;
}

export const PACKAGES: PackageInfo[] = [
  { id: "taster", name: "Taster", glasses: 3.5, price: 25, label: "3.5 Glasses" },
  { id: "weekender", name: "Weekender", glasses: 7, price: 50, label: "7 Glasses" },
  { id: "half_case", name: "Half Case", glasses: 14, price: 100, label: "14 Glasses" },
  { id: "full_case", name: "Full Case", glasses: 28, price: 200, label: "28 Glasses" },
];

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
  flavors: FlavorAssignment[];
  eta: string;
  total: number;
  status: "new" | "prepping" | "ready" | "picked_up";
  createdAt: number;
}
