// src/server.ts — Quality Knowledge Graph & Predictive Risk Engine
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
const startedAt = Date.now();
let tick = 0;
const prs = ["PR #482 (payments refund)", "PR #483 (auth rate-limit)", "PR #484 (search index)", "PR #485 (cart pricing)"];
const traceChains = [
  "incident INC-22 → service payments → file refund.ts → test refund.spec → owner Anjali",
  "incident INC-19 → service auth → file login.ts → test login.spec → owner Bhaskar",
  "incident INC-24 → service search → file indexer.ts → (no test — GAP) → owner Priya",
];
function sim() {
  tick++;
  const risks = prs.map((p) => ({ pr: p, risk: Math.random(), selectedTests: 8 + Math.floor(Math.random() * 16), confidence: 0.6 + Math.random() * 0.35 }));
  const nodes = [
    { id: "svc:payments", type: "service" }, { id: "svc:auth", type: "service" }, { id: "svc:search", type: "service" },
    { id: "file:refund.ts", type: "code" }, { id: "file:login.ts", type: "code" }, { id: "file:indexer.ts", type: "code" },
    { id: "test:refund.spec", type: "test" }, { id: "test:login.spec", type: "test" },
    { id: "inc:INC-22", type: "incident" }, { id: "inc:INC-19", type: "incident" }, { id: "inc:INC-24", type: "incident" },
    { id: "own:Anjali", type: "owner" }, { id: "own:Bhaskar", type: "owner" }, { id: "own:Priya", type: "owner" },
  ];
  const edges = [
    ["svc:payments","file:refund.ts"],["file:refund.ts","test:refund.spec"],["inc:INC-22","file:refund.ts"],["file:refund.ts","own:Anjali"],
    ["svc:auth","file:login.ts"],["file:login.ts","test:login.spec"],["inc:INC-19","file:login.ts"],["file:login.ts","own:Bhaskar"],
    ["svc:search","file:indexer.ts"],["inc:INC-24","file:indexer.ts"],["file:indexer.ts","own:Priya"],
  ];
  return {
    totalNodes: nodes.length, totalEdges: edges.length, coverageGaps: 1 + Math.floor(Math.random() * 4),
    prs: risks, nodes, edges, traceChains,
    savings: 96.2 + Math.random() * 2.5, // % CI time saved by running only selected tests
  };
}
app.get("/api/status", (_q, r) => r.json({ ok: true, uptime: Math.round((Date.now() - startedAt) / 1000), ...sim() }));
app.get("/health", (_q, r) => r.json({ ok: true }));
app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (_q, r) => r.sendFile(path.join(__dirname, "../public/index.html")));
app.listen(Number(process.env.PORT ?? 4302), () => console.log("quality-knowledge-graph → http://localhost:4302"));
