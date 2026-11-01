# StudyBuddy AI Deployment Architecture

Date: 2026-11-01

## Current Architecture

- The React/Vite frontend uses `import.meta.env.VITE_API_URL || '/api'` as its API base. In production, the default is same-origin `/api`; the Vite development server separately proxies `/api` to `http://localhost:5000`.
- `vercel.json` builds the client as a static site and routes `/api/(.*)` requests to `server/index.js`. The Express application mounts its API router at `/api`.
- Docker builds the frontend, copies its output into the backend image, and serves the files through Express. The default `/api` base is same-origin in this setup as well.
- Chat uses the existing SSE response contract. The backend streams Gemini text as `data: {"content":"..."}\n\n`, then sends `data: [DONE]\n\n` and closes the response.
- Chat, Summarizer, Quiz, and Planner use Google Gemini through `@google/genai`. The configured model is `gemini-3.8-flash` in `server/controllers/api.controller.js`. The earlier `gemini-2.5-flash` model returned a 404 for this account and was replaced after a successful live probe of `gemini-3.8-flash`.
- `GEMINI_API_KEY` is read at backend runtime only. It must not be exposed as a frontend build variable. `server/.env.example` contains a placeholder, not a real key.

## Operational Notes

- Express exposes `GET /health`. The Vercel routing rule forwards `/api/*` to the backend, but there is no `/api/health` route in the Express API router.
- The server entry point calls `app.listen(PORT)`. Local startup and route checks pass, but Vercel deployment behavior should be verified in the target environment; no deployment was performed for this review.
- A configured `GEMINI_API_KEY` is required at backend runtime. Local live requests succeeded for Chat streaming, Summarizer, and Quiz. Planner requests timed out during integration testing; this remains unresolved.

## Historical Production Diagnosis

Before the frontend API-base correction, a deployed bundle used `http://localhost:5000/api`. In a visitor's browser, that hostname points to the visitor's own machine, not the deployed backend. The frontend default has since been changed to `/api`, and the localhost proxy is limited to Vite development.

Earlier production checks reported that an empty `POST /api/chat` reached Express validation and that the API CORS preflight succeeded. Those checks did not invoke Gemini. They are historical observations, not a claim about a current deployment or successful provider call.

## Local Verification

On 2026-11-01, local checks confirmed Express startup, `GET /health`, and API validation behavior. The configured key was loaded from the Git-ignored `server/.env`; startup output reported only whether it was set. The frontend build was scanned and did not contain the configured key. Real Gemini requests succeeded for Chat, Summarizer, and Quiz; Planner timed out. A separate invalid-key test confirmed provider errors return without exposing the configured key. No deployment was performed.
