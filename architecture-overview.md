# PathFindR Architecture Overview

_PathFindR analyzes facility imagery, scores risk, and produces compliance-ready guidance. This document pinpoints where each capability lives, how the frontend and backend collaborate, and when external services are invoked._

## Platform Snapshot

| Layer | Responsibilities | Primary Tech | Third-Party Touchpoints |
|-------|------------------|--------------|--------------------------|
| **Frontend** (`src/pathfinder-demo`) | Next.js PWA for camera capture, hazard review, RAG chat, document viewer, offline cache | Next.js 15, React 19, Tailwind, Dexie | Calls backend via `/api/bff/v1/*`; uploads media; consumes assessment + RAG APIs |
| **Backend** (`src/pathfinder-api-demo`) | Auth, assessments, orchestrator, hazard analysis, RAG, reporting, email, observability | NestJS, TypeORM, BullMQ-lite workflows | • Roboflow Hosted API: bounding-box detection<br>• OpenAI GPT‑4o (vision) + GPT‑4o‑mini (chat)<br>• OpenAI `text-embedding-3-small` (embeddings)<br>• Pinecone (vector store)<br>• Mailgun (registration email)<br>• Railway (deploy), Docker Compose (local) |
| **Data** | Canonical store for assessments, hazards, chat, documents | PostgreSQL 15, file system storage, Pinecone index | RAG ingestion/search; assessment lifecycle | 

## Repository Layout

```
pathfinder/
├── src/
│   ├── pathfinder-demo/        # PWA (Next.js)
│   └── pathfinder-api-demo/    # API (NestJS)
├── docs/                      # Documentation (public guides + internal plans)
├── docs/internal/plans/       # Engineering plans / checklists
├── scripts/                   # Railway + ops tooling
├── docker-compose.yml         # Local stack (API + Demo + Postgres)
└── test-suites/               # API & UI contract suites
```

The docs referenced most often during development are:
- `docs/public/architecture-overview.md` (this file)
- `docs/public/agents-architecture.md` (agent + orchestrator catalog)
- `docs/public/image-scan-workflow.md` (end-to-end sequence)
- `docs/public/rag-architecture.md` (document ingestion, RAG, chat)

Additional engineering plans now live under `docs/internal/plans/` to keep the top-level documentation lightweight.

## Backend Architecture

### Module Map

- **Auth (`auth/`)** – Email-white-listed onboarding, JWT issuance, registration tokens. Registration emails are delivered via **Mailgun** when `EMAIL_SERVICE=mailgun`; otherwise they are captured to disk.
- **Assessments (`assessments/`)** – Canonical record of every inspection. Handles remote/local ID mapping, media sync, risk score + hazard payload persistence, and document status updates (`uploading → processing → ready|failed`).
- **Master Orchestrator (`orchestrator/`)** – Central router that coordinates agents. `MasterOrchestrator` chooses a provider/agent (OpenAI, Roboflow, etc.), tracks cost, health, and progress, and notifies the assessments module so documentStatus reflects real-time workflow state.
- **Safety & Hazards (`safety/`)** – `ImageAnalyzerService` orchestrates Roboflow (geometry) + **OpenAI GPT‑4o** (vision JSON) and then fans out to the agent layer: `TierMatchingAgentService` assigns PASS tiers, `RiskScoringAgentService` scores hazards with PASS deductions, `ComplianceAgentService` maps findings to NFPA/OSHA/PASS rules, and `RecommendationAgentService` generates cost/effort guidance. `SafetyKnowledgeService` feeds each agent with RAG-derived excerpts.
- **Scans (`scans/`)** – REST endpoints and entities for ingesting new camera captures and linking them to assessments and media.
- **RAG (`rag/`)** – Document ingestion pipeline (OpenAI embeddings + **Pinecone**), parsing (`pdf-parse`, `mammoth`), and retrieval helpers used by safety knowledge, reporting, and chat.
- **Chat (`chat/`)** – Conversational interface that stitches RAG results into prompts and calls **OpenAI GPT‑4o-mini** for cited responses.
- **Reports (`reports/`)** – Aggregates analysis payloads, recommendations, and compliance issues for downstream PDF/JSON export.
- **Email (`auth/services/email.service.ts`)** – Wraps Mailgun and SMTP; falls back to file capture when no provider is configured.

### Third-Party Call Timeline

1. **Hazard Analysis** (`POST /api/v1/safety/analyze-image`)
   1. Store inbound request metadata, mark assessment `documentStatus=processing`.
   2. `RoboflowDetectorService` → Roboflow Hosted API (`safety-hazard-identification/4`) for bounding boxes.
   3. `ImageAnalyzerService` → OpenAI GPT‑4o (vision) for structured JSON describing hazards, severity, remediation, compliance.
   4. `SafetyKnowledgeService` → RAG (`RagService.searchDocuments`) to pull PASS and Risk Scoring reference text; falls back to on-disk PDFs if RAG is unavailable.
   5. Agent layer executes sequentially:
      - `TierMatchingAgentService` assigns PASS tiers and rationales per hazard.
      - `RiskScoringAgentService` computes PASS-style deductions and overall risk score.
      - `ComplianceAgentService` maps hazards to NFPA/OSHA/PASS violations with remediation guidance.
      - `RecommendationAgentService` emits cost/effort-aware corrective actions.
   6. Persist consolidated payload in Postgres (`image_analysis_results`) and update the parent assessment with risk score, hazard count, and document status `ready|failed`.

2. **Chat / Ask Guy** (`POST /api/v1/chat/message`)
   1. `ChatService` embeds the query via OpenAI embeddings (`text-embedding-3-small`).
   2. Query Pinecone for the top-k document chunks (PASS, risk scoring docs, etc.).
   3. Prompt OpenAI GPT‑4o-mini with conversation history and citations; persist response and source list.

3. **Onboarding Email** (`POST /api/v1/auth/register/initiate`)
   1. Confirm email is in `email_whitelist` and not rate-limited.
   2. Generate registration token, store in Postgres.
   3. Invoke Mailgun (if configured) to send the invite; errors are logged but do not block the API response.

### Storage & Data Sync

- **Postgres** – All canonical state (assessments, media metadata, RAG documents, chat history, tokens).
- **File System (Docker volume / Railway persistent disk)** – Uploaded documents, camera media, generated reports.
- **Pinecone** – Semantic index keyed by document ID + page metadata. Automatically created by the API on startup if missing.
- **Dexie (frontend IndexedDB)** – Mirror of assessments/media to support offline flows; hydrated from the API after orchestrations complete or when the device reconnects.

## Frontend Architecture

- **Routing** – App Router (`app/`) organizes experiences: camera capture (`/camera`), dashboard (`/reports`), analysis detail (`/analysis/[id]`), RAG documents (`/documents`), chat (`/chat`).
- **Services (`lib/services/`)** – Thin client-side wrappers around the API. `assessmentService` first writes to the server, then syncs Dexie. `aiAnalysisService` wraps the hazard analysis endpoints. `mediaService` caches blobs locally and backfills remote media if Dexie starts empty.
- **Sync & Offline** – Global `SyncService` runs after hydration, after queue flushes, on manual “Sync now”, and when the browser fires `online`. Queued mutations replay against the API and then refresh Dexie snapshots.
- **BFF Proxy (`app/api/bff/[...path]/route.ts`)** – Proxies frontend requests to the API while normalizing `/api/v1/*` paths, handling auth headers, and enabling same-origin cookie management.
- **UI Composition** – Tailwind + Shadcn-like primitives for hazard overlays, compliance badges, risk gauges, and chat transcripts. The analysis viewport uses `react-zoom-pan-pinch` so hazard geometry remains aligned while zooming.

## Key Data Flows

### Camera Capture → Assessment

1. Camera UI creates a remote assessment (`POST /api/v1/assessments`) as soon as a session starts, mirrors the shell to IndexedDB, and stores staged media locally.
2. When the operator captures images, the app uploads media via `assessment/media` endpoints, then triggers `aiAnalysisService.analyzeImage`.
3. The backend orchestrates detection (Roboflow), LLM reasoning (OpenAI), and knowledge lookups (RAG). Results are persisted, Dexie is refreshed after sync, and the `/analysis/[id]` page hydrates from the API first.

### RAG Document Lifecycle

1. Operators upload PDFs/DOCX/TXT; `RagService` parses them (`pdf-parse`, `mammoth`), generates embeddings (OpenAI), and upserts vectors in Pinecone.
2. PASS checklists and risk-scoring docs are the primary source for safety intelligence; the knowledge service queries the same RAG corpus to keep deductions in sync with the latest materials.
3. Chat and reporting re-use those embeddings, providing citations that open in the viewer at the exact page referenced.

## Deployment & Ops

- **Local** – `docker-compose.yml` bootstraps Postgres, API, Demo (and optional Loki/Grafana). Environment defaults live in `.env.example`.
- **Railway** – `Makefile` targets (`make railway-deploy`, `railway-deploy-demo`, etc.) package and push Docker images. Sync scripts (`scripts/railway-sync-api.sh`, etc.) keep env vars aligned.
- **CI/CD** – GitHub Actions (`.github/workflows/*.yml`) run lint/test/build per submodule and validate DB migrations against scratch instances before deploy.

## Related Documentation

- `docs/public/agents-architecture.md` – Deep dive on orchestrator providers, agent catalog, and sequencing.
- `docs/public/image-scan-workflow.md` – Step-by-step timeline for camera-to-report flows (UI + API perspective).
- `docs/public/rag-architecture.md` – Document ingestion, Pinecone topology, and chat citation behavior.
- `docs/internal/plans/` – Engineering plans, checklists, and migration playbooks (internal use).

Keep this document updated whenever a new service is introduced, an external dependency changes, or ownership shifts between submodules.
