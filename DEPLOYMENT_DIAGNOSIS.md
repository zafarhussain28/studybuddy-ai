# StudyBuddy AI Deployment Architecture

Date: 2026-11-01

## Current Architecture

- The React/Vite frontend uses `import.meta.env.VITE_API_URL || '/api'` as its API base. In production, the default is same-origin `/api`; the Vite development server separately proxies `/api` to `http://localhost:5000`.
- `vercel.json` builds the client as a static site and routes `/api/(.*)` requests to `server/index.js`. The Express application mounts its API router at `/api`.
- Docker builds the frontend, copies its output into the backend image, and serves the files through Express. The default `/api` base is same-origin in this setup as well.
- Chat preserves the existing SSE response contract: `data: {"content":"..."}\n\n`, followed by `data: [DONE]\n\n` on success.
- Chat, Summarizer, Quiz, and Planner use OpenRouter's OpenAI-compatible chat completions endpoint and the fixed `google/gemma-4-31b-it:free` model.
- The model ID is checked for the `:free` suffix at startup and before requests. OpenRouter provider fallbacks are disabled, and the application never selects another model or provider.
- `OPENROUTER_API_KEY` is read by backend code only. It must not be exposed as a frontend build variable. `server/.env.example` contains a placeholder, not a real key.

## Reliability and Operations

- Transient HTTP statuses (429, 500, 502, and 503, plus gateway/timeout equivalents) receive at most two retries with exponential backoff and jitter. Authentication and malformed-request errors are not retried.
- Streaming retries happen only before a successful upstream response. Once stream processing begins, an error is returned in the existing SSE error event and the partial response is never restarted.
- The Planner prompt and response shape are unchanged. Its output is capped at 1,200 tokens to bound generation after Planner timed out in prior Gemini integration tests. Planner must still be verified against the OpenRouter free model.
- Express exposes `GET /health`. The Vercel routing rule forwards `/api/*` to the backend, but there is no `/api/health` route in the Express API router.
- Deployment behavior has not been tested; no deployment was performed for this migration.

## Historical Production Diagnosis

Before the frontend API-base correction, a deployed bundle used `http://localhost:5000/api`. In a visitor's browser, that hostname points to the visitor's own machine, not the deployed backend. The frontend default has since been changed to `/api`, and the localhost proxy is limited to Vite development.

Earlier production checks reported that an empty `POST /api/chat` reached Express validation and that the API CORS preflight succeeded. Those checks did not invoke an AI provider. They are historical observations, not a claim about a current deployment or successful provider call.
