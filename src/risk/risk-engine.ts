// src/risk/risk-engine.ts — predictive risk scoring using graph features
import type { Graph, RiskPrediction } from "../types.js";
import { findCoverageGaps } from "../graph/graph-builder.js";

/** Predict risk for a PR based on graph features. */
export function predictRisk(
  graph: Graph,
  pr: string,
  changedFiles: string[],
): RiskPrediction {
  let incidentCount = 0;
  let uncoveredCount = 0;
  let complexitySum = 0;

  // Count incidents touching changed files
  for (const file of changedFiles) {
    const fileId = `file:${file}`;
    const incidents = graph.edges.filter(e => e.type === "caused-by" && e.target === fileId).length;
    incidentCount += incidents;
  }

  // Count coverage gaps among changed files
  const gaps = findCoverageGaps(graph);
  for (const file of changedFiles) {
    if (gaps.some(g => g.node === `file:${file}`)) uncoveredCount++;
  }

  // Sum complexity of changed files
  for (const file of changedFiles) {
    const node = graph.nodes.find(n => n.id === `file:${file}`);
    if (node?.meta?.complexity) complexitySum += node.meta.complexity as number;
  }

  // Risk score (weighted combination)
  const risk = Math.min(1,
    (incidentCount * 0.15) +
    (uncoveredCount * 0.20) +
    Math.min(0.3, complexitySum * 0.02) +
    (changedFiles.length > 5 ? 0.15 : 0)
  );

  // Select tests: find tests covering the changed files
  const selectedTests = new Set<string>();
  for (const file of changedFiles) {
    const fileId = `file:${file}`;
    for (const e of graph.edges) {
      if (e.source === fileId && e.type === "tested-by") {
        selectedTests.add(e.target.replace("test:", ""));
      }
    }
  }

  const confidence = Math.min(0.98, 0.5 + (incidentCount * 0.1) + (uncoveredCount * 0.05));

  return {
    pr, changedFiles,
    risk: parseFloat(risk.toFixed(3)),
    confidence: parseFloat(confidence.toFixed(2)),
    selectedTests: [...selectedTests],
    factors: { incidents: incidentCount, uncovered: uncoveredCount, complexity: complexitySum },
  };
}
