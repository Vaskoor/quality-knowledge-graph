// src/types.ts — shared types for the Quality Knowledge Graph & Predictive Risk Engine
export type NodeType = "code" | "test" | "incident" | "owner" | "deploy" | "service";
export type EdgeType = "tested-by" | "caused-by" | "owned-by" | "deployed" | "depends-on";

export interface GraphNode { id: string; type: NodeType; label: string; meta?: Record<string, unknown>; }
export interface GraphEdge { source: string; target: string; type: EdgeType; }
export interface Graph { nodes: GraphNode[]; edges: GraphEdge[]; }

export interface TracePath { nodes: string[]; edges: EdgeType[]; }

export interface CoverageGap { node: string; type: NodeType; detail: string; }
export interface RiskPrediction {
  pr: string; changedFiles: string[]; risk: number; // 0-1
  confidence: number; selectedTests: string[]; factors: { incidents: number; uncovered: number; complexity: number };
}
export interface TestSelection { tests: string[]; totalAvailable: number; selected: number; reason: string; }
