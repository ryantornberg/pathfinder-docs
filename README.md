# PathFindR Documentation Portal

PathFindR is an educational facility risk management platform that blends AI image analysis, retrieval-augmented knowledge, and streamlined reporting to help schools spot hazards and stay compliant. This public documentation distills how the product works for both day-to-day users and the teams who design, build, and operate the system.

## Who Should Read This

### Safety Teams & End Users
- Understand what the PathFindR demo experience provides: image capture and upload, hazard reviews, Ask Guy chat for follow-up questions, and document management for safety references.
- Learn what to expect from the AI analysis pipeline, risk scoring, and compliance guidance delivered after each scan.

### Architects & Engineers
- Dive into subsystem guides that walk through the NestJS backend, Next.js PWA, and supporting agents/orchestrators.
- Explore how Retrieval-Augmented Generation (RAG) powers both the chat experience and safety knowledge modules.
- Review deployment expectations (Docker Compose locally, Railway in production) and external dependencies such as OpenAI, Pinecone, and Roboflow.

## Document Library
- [System Architecture Overview](architecture-overview.md) — Big-picture map of frontend, backend, and data services, including deployment considerations.
- [Agents & Orchestration](agents-architecture.md) — Details on the Master Orchestrator, routing logic, and the suite of safety, knowledge, and chat agents.
- [Image Analysis Pipeline](image-analysis-pipeline.md) — How camera captures flow through Roboflow detection, GPT-4o reasoning, and PASS-aligned risk scoring.
- [End-to-End Scan Workflow](image-scan-workflow.md) — Step-by-step walkthrough of a site assessment from capture to report delivery.
- [RAG / Knowledge Architecture](rag-architecture.md) — Document ingestion, Pinecone topology, and citation behavior for chat and safety knowledge.

> Looking for engineering playbooks, historical plans, or internal checklists? Those remain in `docs/internal/` inside the private repository.

## How This Site Is Published
The Markdown files in `docs/public/` live alongside the private codebase. A GitHub Action keeps this folder in sync with the public [`pathfinder-docs`](https://github.com/ryantornberg/pathfinder-docs) repository so updates here automatically refresh the published documentation.
