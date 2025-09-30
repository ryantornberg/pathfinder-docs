# PathFindR User Guide

This guide walks safety teams through the PathFindR demo experience—from signing in to exporting reports—so you can run assessments smoothly in the field or back at headquarters.

## 1. Getting Started

### 1.1 Access & Login
- PathFindR is invite-only. Make sure your email is whitelisted by an admin before launching the app.
- Open the demo URL and choose **Log in**.
- Check your inbox for the registration email. If you’re working in a non-production environment, look for the email token in the backend logs (`src/pathfinder-api-demo/logs/`).
- Create your password, confirm, and sign in.

### 1.2 Navigation Basics
- The left navigation (desktop) or bottom tab bar (mobile) provides quick access to **Dashboard**, **Camera**, **Reports**, **Documents**, and **Chat**.
- A sync indicator appears when the device is offline; queued actions will replay automatically when you reconnect.

## 2. Running a Site Assessment

### 2.1 Start a New Assessment
1. From the **Dashboard**, click **Start assessment** (or the `+` button on mobile).
2. PathFindR creates a draft assessment immediately, saves it locally for offline use, and opens the capture workflow.

### 2.2 Capture & Upload Images
- Switch to the **Camera** view (or tap **Add media** within the assessment).
- Capture new photos directly or select existing images from the device gallery.
- When you press **Upload & analyze**, the backend orchestrator sends the image through Roboflow detection and GPT-4o reasoning.

### 2.3 Track Processing Status
- Each image shows a status badge: **Uploading**, **Processing**, **Ready**, or **Failed**.
- If an analysis fails, use the **Reanalyze** option to retry once connectivity is restored.

## 3. Reviewing Hazard Analysis

### 3.1 Hazard Overlays
- Open an assessment and select a processed image to view bounding boxes over detected hazards.
- Use pinch-to-zoom (mobile) or the zoom controls (desktop) to inspect details. The overlay automatically accounts for letterboxing and aspect ratio.

### 3.2 PASS Scoring & Compliance
- The right-hand panel (or accordion on mobile) lists each hazard with:
  - PASS tier classification.
  - Severity rating and calculated risk score deduction.
  - Recommended remediation steps with effort/cost hints.
  - Compliance citations (NFPA 101, OSHA 1910, ADA) where applicable.
- Toggle **Accept** or **Dismiss** to keep the official hazard list accurate; decisions sync back to the backend once wired in.

- Add assessor notes to hazards after the initial analysis so follow-up teams know the site context.
- The provenance section (if enabled) shows which AI services and knowledge sources produced the finding—a quick way to verify citations during audits.

## 4. Ask Guy: Follow-Up Questions

### 4.1 Starting a Conversation
- Open the **Chat** tab and pick an existing session or start a new one.
- Type questions like “What’s the standard clearance for this exit?” or “Which PASS tier applies to covered fire alarms?”

### 4.2 Understanding Responses
- Ask Guy retrieves relevant document excerpts using Retrieval-Augmented Generation (RAG) and answers with citations.
- Click a source badge to open the document viewer at the exact cited page.
- All conversations persist in the database; if you go offline, cached responses reload with their original sources once you reconnect.

## 5. Managing Documents

### 5.1 Uploading Safety References
- Visit **Documents** → **Upload** to add PDFs, DOCX, TXT, or Markdown files (PASS checklists, district policies, risk-scoring tables).
- The backend parses the file, creates embeddings, and indexes it in Pinecone. Status moves from **Processing** to **Ready** when complete.

### 5.2 Reprocessing & Deleting
- Use **Reprocess** after editing a document so embeddings stay current.
- **Delete** removes the file from storage and Pinecone; only do this if the document is obsolete.

## 6. Reporting & Follow-Up

### 6.1 Reports View
- From **Reports**, open any completed analysis to review a consolidated summary—risk score, hazard list, remediation status.
- Use filters to switch between your assessments and the district-wide view (feature in progress).

### 6.2 Export Options
- Download the PDF report for board presentations or compliance submissions.
- Export the hazard dataset (CSV/JSON) if you need to ingest results into another workflow or BI tool (coming soon).

## 7. Working Offline
- PathFindR caches assessments, media, and chat history locally using IndexedDB (via Dexie).
- When offline, continue capturing photos and drafting notes. A banner shows queued actions.
- Once back online, the app syncs automatically—no manual refresh required.

## 8. Troubleshooting
- **Stuck in Processing**: Check connectivity; re-run the analysis when back online. If the issue persists, review backend logs for provider errors.
- **No Registration Email**: Verify the email is whitelisted. In dev environments, open the captured email file under `src/pathfinder-api-demo/logs/`.
- **Missing Documents in Chat**: Ensure the document status is **Ready**. Reprocess if it recently changed.
- **Token Expiration**: Sessions expire after 2 hours. Log back in and your data will reload from the server.

## 9. Need Help?
- Reach out to the PathFindR engineering team via the usual support channel or submit a ticket with timestamps, assessment links, and any error messages.
- For architecture or customization questions, explore the accompanying documents:
  - [Architecture Overview](architecture-overview.md)
  - [Agents & Orchestration](agents-architecture.md)
  - [Image Scan Workflow](image-scan-workflow.md)
  - [RAG Architecture](rag-architecture.md)
