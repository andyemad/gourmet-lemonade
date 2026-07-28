import { describe, expect, it } from "vitest";
import {
  ETA_PRESETS,
  PACKAGES,
  getPackageInfo,
  etaLabel,
} from "./types";

describe("package pricing", () => {
  it("offers four $60 price increments through $240", () => {
    expect(PACKAGES.map((pkg) => pkg.price)).toEqual([60, 120, 180, 240]);
    expect(PACKAGES.map((pkg) => pkg.quantity)).toEqual([1, 2, 3, 4]);
  });

  it("calculates a custom batch quantity at $60 per batch", () => {
    expect(getPackageInfo("custom", 6)).toMatchObject({
      id: "custom",
      quantity: 6,
      glasses: 42,
      price: 360,
    });
  });

  it("rejects invalid custom quantities", () => {
    expect(() => getPackageInfo("custom", 0)).toThrow("Invalid custom quantity");
    expect(() => getPackageInfo("custom", 1.5)).toThrow("Invalid custom quantity");
  });
});

describe("pickup choices", () => {
  it("offers the requested pickup presets", () => {
    expect(ETA_PRESETS.map((preset) => preset.label)).toEqual([
      "Less than 15 minutes",
      "20 minutes",
      "30 minutes",
      "45 minutes",
      "1 hr +",
    ]);
  });

  it("formats a custom pickup time", () => {
    expect(etaLabel("custom:Around 2:30 PM")).toBe("Around 2:30 PM");
  });
});
