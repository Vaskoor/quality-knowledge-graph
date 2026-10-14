# Quality Knowledge Graph & Predictive Risk Engine

<div align="center">
**A graph of code, services, tests, requirements, incidents, bugs, owners, and deployments. Use it to predict risk and select tests.**
![node](https://img.shields.io/badge/node-%3E%3D20-brightgreen) ![license](https://img.shields.io/badge/license-MIT-blue)
</div>

## Overview
- **Neo4j graph** spanning the whole SDLC — code, test, incident, owner, deploy nodes with typed edges.
- **Risk prediction** — for each PR, compute risk from graph features (incidents touching changed files, coverage gaps, code complexity).
- **Test selection** — "Run these 12 tests, not all 4,000" → risk-ranked subset, deduplicated.
- **Traceability** — BFS from incident → code → test → owner.
- **Coverage gaps** — find code files with no test.

## Architecture
```
src/
├── types.ts                    # GraphNode, GraphEdge, Graph, RiskPrediction, TestSelection
├── graph/
│   └── graph-builder.ts        # Build SDLC graph + findCoverageGaps + tracePath (BFS)
├── risk/
│   └── risk-engine.ts          # predictRisk: incidents + uncovered + complexity → risk 0-1
├── selection/
│   └── test-selector.ts        # selectTests (dedup + sort by risk) + computeSavings
└── server.ts                   # Express API: /api/status, /api/risk, /api/select, /api/trace, /api/gaps
```

## API
| Method | Path | Purpose |
|--------|------|---------|
| GET | /health | Liveness |
| GET | /api/status | Graph nodes/edges + coverage gaps |
| POST | /api/risk | Predict risk for a PR (changedFiles) |
| POST | /api/select | Select tests from risk predictions |
| GET | /api/trace/:startId | BFS traceability path |
| GET | /api/gaps | List coverage gaps |

## Tests
```bash
npm test    # 14 unit tests
```
- `tests/graph.test.ts` — graph building (5) + risk prediction (4) + test selection (3) + coverage gaps + traceability

## Run
```bash
npm install && npm test && npm run dev   # → http://localhost:4302
```
## Stack
Neo4j · GNN · LLM · GitHub API · Jira · CI · TypeScript · Express
## License
MIT
