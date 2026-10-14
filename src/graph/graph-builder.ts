// src/graph/graph-builder.ts — build the SDLC knowledge graph
import type { Graph, GraphNode, GraphEdge } from "../types.js";

/** Build a graph from structured SDLC data. */
export function buildGraph(data: {
  files: { path: string; module: string; complexity: number }[];
  tests: { name: string; file: string; tests: string[] }[];
  incidents: { id: string; module: string; severity: string }[];
  owners: { name: string; modules: string[] }[];
  deploys: { id: string; commit: string; files: string[] }[];
}): Graph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  for (const f of data.files) {
    nodes.push({ id: `file:${f.path}`, type: "code", label: f.path, meta: { module: f.module, complexity: f.complexity } });
  }
  for (const t of data.tests) {
    nodes.push({ id: `test:${t.name}`, type: "test", label: t.name, meta: { file: t.file } });
    for (const tested of t.tests) {
      edges.push({ source: `file:${tested}`, target: `test:${t.name}`, type: "tested-by" });
    }
  }
  for (const inc of data.incidents) {
    nodes.push({ id: `inc:${inc.id}`, type: "incident", label: inc.id, meta: { module: inc.module, severity: inc.severity } });
    // link to files in the module
    const modFiles = data.files.filter(f => f.module === inc.module);
    for (const f of modFiles) {
      edges.push({ source: `inc:${inc.id}`, target: `file:${f.path}`, type: "caused-by" });
    }
  }
  for (const o of data.owners) {
    nodes.push({ id: `own:${o.name}`, type: "owner", label: o.name, meta: { modules: o.modules } });
    for (const m of o.modules) {
      const modFiles = data.files.filter(f => f.module === m);
      for (const f of modFiles) {
        edges.push({ source: `file:${f.path}`, target: `own:${o.name}`, type: "owned-by" });
      }
    }
  }
  for (const d of data.deploys) {
    nodes.push({ id: `dep:${d.id}`, type: "deploy", label: d.id, meta: { commit: d.commit } });
    for (const f of d.files) {
      edges.push({ source: `dep:${d.id}`, target: `file:${f}`, type: "deployed" });
    }
  }

  return { nodes, edges };
}

/** Find coverage gaps: code files with no test. */
export function findCoverageGaps(graph: Graph): { node: string; type: string; detail: string }[] {
  const codeNodes = graph.nodes.filter(n => n.type === "code");
  const gaps: { node: string; type: string; detail: string }[] = [];
  for (const code of codeNodes) {
    const hasTest = graph.edges.some(e => e.source === code.id && e.type === "tested-by");
    if (!hasTest) {
      gaps.push({ node: code.id, type: "code", detail: `${code.label} has no test covering it` });
    }
  }
  return gaps;
}

/** BFS traceability: find a path from incident → code → test → owner. */
export function tracePath(graph: Graph, startId: string, endType: string): { nodes: string[]; edges: string[] }[] {
  const adjacency: Record<string, { target: string; type: string }[]> = {};
  for (const e of graph.edges) {
    if (!adjacency[e.source]) adjacency[e.source] = [];
    adjacency[e.source].push({ target: e.target, type: e.type });
  }
  const paths: { nodes: string[]; edges: string[] }[] = [];
  const queue: { id: string; path: string[]; edges: string[] }[] = [{ id: startId, path: [startId], edges: [] }];
  const visited = new Set<string>();
  while (queue.length > 0 && paths.length < 5) {
    const cur = queue.shift()!;
    if (visited.has(cur.id)) continue;
    visited.add(cur.id);
    const node = graph.nodes.find(n => n.id === cur.id);
    if (node && node.type === endType && cur.path.length > 1) {
      paths.push({ nodes: cur.path, edges: cur.edges });
      continue;
    }
    for (const next of adjacency[cur.id] || []) {
      if (!visited.has(next.target)) {
        queue.push({ id: next.target, path: [...cur.path, next.target], edges: [...cur.edges, next.type] });
      }
    }
  }
  return paths;
}
