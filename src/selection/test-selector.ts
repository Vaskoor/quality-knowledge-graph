// src/selection/test-selector.ts — "Run these 12 tests, not all 4,000"
import type { RiskPrediction } from "../types.js";

/** Select tests from risk predictions, sorted by risk. */
export function selectTests(
  predictions: RiskPrediction[],
  maxTests = 20,
): { tests: string[]; totalAvailable: number; selected: number; reason: string } {
  // Merge all selected tests from all predictions, dedup, sort by PR risk
  const testToRisk: Record<string, number> = {};
  for (const p of predictions) {
    for (const t of p.selectedTests) {
      testToRisk[t] = Math.max(testToRisk[t] || 0, p.risk);
    }
  }
  // Sort by risk descending, take top N
  const sorted = Object.entries(testToRisk).sort((a, b) => b[1] - a[1]);
  const selected = sorted.slice(0, maxTests).map(([t]) => t);
  const totalAvailable = sorted.length;
  const reason = predictions.length > 0
    ? `Selected ${selected.length} tests from ${predictions.length} PR(s) based on risk overlap`
    : "No changed files — selecting all";
  return { tests: selected, totalAvailable, selected: selected.length, reason };
}

/** Compute CI savings from test selection. */
export function computeSavings(selected: number, total: number): { pct: number; timeSavedSec: number; avgTestSec: number } {
  const pct = total > 0 ? (1 - selected / total) * 100 : 0;
  const avgTestSec = 5; // assume 5s per test
  const timeSavedSec = (total - selected) * avgTestSec;
  return { pct: parseFloat(pct.toFixed(1)), timeSavedSec, avgTestSec };
}
