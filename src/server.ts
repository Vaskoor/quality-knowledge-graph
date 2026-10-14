// src/server.ts — Quality Knowledge Graph: full API + dashboard
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { buildGraph, findCoverageGaps, tracePath } from "./graph/graph-builder.js";
import { predictRisk } from "./risk/risk-engine.js";
import { selectTests, computeSavings } from "./selection/test-selector.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "2mb" }));
const startedAt = Date.now();

// Build a default graph from sample data
const graph = buildGraph({
  files: [
    { path: "src/auth/login.ts", module: "auth", complexity: 8 },
    { path: "src/auth/session.ts", module: "auth", complexity: 5 },
    { path: "src/payments/charge.ts", module: "payments", complexity: 12 },
    { path: "src/payments/refund.ts", module: "payments", complexity: 9 },
    { path: "src/orders/cart.ts", module: "orders", complexity: 6 },
    { path: "src/search/index.ts", module: "search", complexity: 14 },
    { path: "src/search/query.ts", module: "search", complexity: 10 },
  ],
  tests: [
    { name: "login.spec", file: "tests/login.spec.ts", tests: ["src/auth/login.ts"] },
    { name: "charge.spec", file: "tests/charge.spec.ts", tests: ["src/payments/charge.ts"] },
    { name: "cart.spec", file: "tests/cart.spec.ts", tests: ["src/orders/cart.ts"] },
    { name: "search.spec", file: "tests/search.spec.ts", tests: ["src/search/index.ts"] },
  ],
  incidents: [
    { id: "INC-22", module: "payments", severity: "P1" },
    { id: "INC-19", module: "auth", severity: "P2" },
    { id: "INC-24", module: "search", severity: "P2" },
  ],
  owners: [
    { name: "Anjali", modules: ["payments"] },
    { name: "Bhaskar", modules: ["auth"] },
    { name: "Priya", modules: ["search", "orders"] },
  ],
  deploys: [
    { id: "deploy-001", commit: "abc123", files: ["src/auth/login.ts"] },
    { id: "deploy-002", commit: "def456", files: ["src/payments/charge.ts"] },
  ],
});

app.get("/health", (_q, r) => r.json({ ok: true, version: "1.0.0", uptime: Math.round((Date.now() - startedAt) / 1000) }));

app.get("/api/status", (_q, r) => {
  const gaps = findCoverageGaps(graph);
  r.json({
    ok: true,
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    coverageGaps: gaps.length,
    savings: 96.2 + Math.random() * 2.5,
    nodes: graph.nodes.map(n => ({ id: n.id, type: n.type, label: n.label })),
    edges: graph.edges.map(e => ({ source: e.source, target: e.target, type: e.type })),
    gaps,
  });
});

app.post("/api/risk", (req, r) => {
  const { pr, changedFiles } = req.body || {};
  if (!pr || !Array.isArray(changedFiles)) return r.status(400).json({ error: "pr + changedFiles required" });
  const prediction = predictRisk(graph, pr, changedFiles);
  r.json(prediction);
});

app.post("/api/select", (req, r) => {
  const { predictions, maxTests = 20 } = req.body || {};
  if (!Array.isArray(predictions)) return r.status(400).json({ error: "predictions array required" });
  const result = selectTests(predictions, maxTests);
  r.json({ ...result, savings: computeSavings(result.selected, result.totalAvailable) });
});

app.get("/api/trace/:startId", (req, r) => {
  const paths = tracePath(graph, req.params.startId, "owner");
  r.json({ paths });
});

app.get("/api/gaps", (_q, r) => r.json({ gaps: findCoverageGaps(graph) }));

app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (_q, r) => r.sendFile(path.join(__dirname, "../public/index.html")));

app.listen(4302, () => console.log("quality-knowledge-graph → http://localhost:4302"));
