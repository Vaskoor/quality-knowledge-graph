# Quality Knowledge Graph & Predictive Risk Engine

<div align="center">**A graph of code, services, tests, requirements, incidents, bugs, owners, and deployments. Use it to predict risk and select tests.**</div>

## What it does
- **Neo4j graph** spanning the whole SDLC — every commit, file, test, incident, owner, deploy is a node with typed edges.
- **GNN + LLM risk prediction** — for each PR, the graph neural net + LLM score how risky the change is and which tests to run.
- **Smart selection** — *"Run these 12 tests, not all 4,000"* → CI finishes in seconds, not hours.
- **Coverage gaps** — code with no test, tests with no owner, surfaced automatically.
- **Traceability** — incident → code → test → owner, so blame never points at the void.

## Architecture
| Layer | Tech |
|-------|------|
| Graph store | Neo4j (nodes: code/service/test/incident/owner/deploy) |
| Risk model | Graph Neural Network + LLM (graph features + embeddings) |
| Integrations | GitHub/GitLab API, Jira, CI webhooks |
| Selection | risk-ranked test subset gated into CI |
| UI | this dashboard (graph viz + per-PR risk + trace chains) |

## Run
```bash
npm install && npm run dev   # → http://localhost:4302
```
## Why it's OG
This is "Google's Test Automation Platform for everyone" — staff/principal-level systems thinking.
## License
MIT
