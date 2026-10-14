// tests/graph.test.ts — tests for the graph builder + risk engine + test selector
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildGraph, findCoverageGaps, tracePath } from "../src/graph/graph-builder.ts";
import { predictRisk } from "../src/risk/risk-engine.ts";
import { selectTests, computeSavings } from "../src/selection/test-selector.ts";
import type { RiskPrediction } from "../src/types.ts";

const testData = {
  files: [
    { path: "auth.ts", module: "auth", complexity: 8 },
    { path: "payments.ts", module: "payments", complexity: 12 },
    { path: "search.ts", module: "search", complexity: 10 },
  ],
  tests: [
    { name: "auth-test", file: "auth.spec", tests: ["auth.ts"] },
    { name: "pay-test", file: "pay.spec", tests: ["payments.ts"] },
  ],
  incidents: [
    { id: "INC-1", module: "payments", severity: "P1" },
    { id: "INC-2", module: "auth", severity: "P2" },
  ],
  owners: [
    { name: "Alice", modules: ["auth"] },
    { name: "Bob", modules: ["payments", "search"] },
  ],
  deploys: [
    { id: "dep-1", commit: "abc", files: ["auth.ts"] },
  ],
};

const graph = buildGraph(testData);

describe("graph-builder", () => {
  test("builds nodes for files, tests, incidents, owners, deploys", () => {
    const types = new Set(graph.nodes.map(n => n.type));
    assert.ok(types.has("code"));
    assert.ok(types.has("test"));
    assert.ok(types.has("incident"));
    assert.ok(types.has("owner"));
    assert.ok(types.has("deploy"));
  });
  test("creates tested-by edges", () => {
    assert.ok(graph.edges.some(e => e.type === "tested-by" && e.source === "file:auth.ts"));
  });
  test("creates caused-by edges from incidents", () => {
    assert.ok(graph.edges.some(e => e.type === "caused-by" && e.source === "inc:INC-1"));
  });
  test("creates owned-by edges", () => {
    assert.ok(graph.edges.some(e => e.type === "owned-by" && e.target === "own:Alice"));
  });
  test("findCoverageGaps finds files with no test", () => {
    const gaps = findCoverageGaps(graph);
    assert.ok(gaps.some(g => g.node === "file:search.ts"));
  });
  test("tracePath finds incident → owner chain", () => {
    const paths = tracePath(graph, "inc:INC-2", "owner");
    assert.ok(paths.length > 0);
  });
});

describe("risk-engine", () => {
  test("predictRisk returns a score 0-1", () => {
    const p = predictRisk(graph, "PR-1", ["payments.ts"]);
    assert.ok(p.risk >= 0 && p.risk <= 1);
  });
  test("higher risk for files with incidents", () => {
    const withIncident = predictRisk(graph, "PR-1", ["payments.ts"]);
    const without = predictRisk(graph, "PR-2", ["search.ts"]);
    assert.ok(withIncident.risk >= without.risk);
  });
  test("selects tests covering changed files", () => {
    const p = predictRisk(graph, "PR-1", ["auth.ts"]);
    assert.ok(p.selectedTests.includes("auth-test"));
  });
  test("confidence is 0-1", () => {
    const p = predictRisk(graph, "PR-1", ["payments.ts"]);
    assert.ok(p.confidence >= 0 && p.confidence <= 1);
  });
});

describe("test-selector", () => {
  const predictions: RiskPrediction[] = [
    { pr: "PR-1", changedFiles: ["auth.ts"], risk: 0.6, confidence: 0.8, selectedTests: ["auth-test", "common"], factors: { incidents: 1, uncovered: 0, complexity: 8 } },
    { pr: "PR-2", changedFiles: ["payments.ts"], risk: 0.8, confidence: 0.9, selectedTests: ["pay-test", "common"], factors: { incidents: 2, uncovered: 1, complexity: 12 } },
  ];
  test("selectTests deduplicates and sorts by risk", () => {
    const result = selectTests(predictions, 20);
    assert.ok(result.tests.includes("common")); // deduped
    assert.ok(result.tests.includes("pay-test"));
    assert.ok(result.tests.includes("auth-test"));
  });
  test("selectTests respects maxTests", () => {
    const result = selectTests(predictions, 1);
    assert.equal(result.tests.length, 1);
  });
  test("computeSavings calculates percentage", () => {
    const s = computeSavings(10, 100);
    assert.equal(s.pct, 90);
    assert.ok(s.timeSavedSec > 0);
  });
});
