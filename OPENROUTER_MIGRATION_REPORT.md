# StudyBuddy AI OpenRouter Migration Report

**Date:** 2026-11-01

## Summary

StudyBuddy AI is configured to use OpenRouter's OpenAI-compatible chat completions API. The server-side model is `google/gemma-4-31b-it:free`; it was verified in OpenRouter's live model listing at <https://openrouter.ai/api/v1/models>.

The backend migration covers Chat, Chat streaming, Summarizer, Quiz, and Planner while retaining existing prompts, conversation history handling, response fields, and the SSE event format.

## Free-only safeguards

- All four AI features use the same server-configured model ID.
- The configured model must end with `:free`; startup and generation reject model IDs that do not.
- Frontend requests cannot select a model.
- OpenRouter provider fallbacks are disabled. The application does not switch models or providers if the selected free model is unavailable.
- Invalid keys and malformed requests are not retried. Transient errors receive at most two retries with exponential backoff and jitter.
- Streaming is not restarted after content has begun, preventing duplicate partial responses.
- No automatic top-ups, purchases, billing changes, or paid fallback are configured.

## Test results

### Mocked tests

- Backend: **9 passed, 0 failed**. Covers Chat SSE, Summarizer, Quiz, Planner, model enforcement, transient retries, safe error responses, and stream errors after partial output.
- Frontend: **6 passed, 0 failed**. Covers SSE parsing, event boundaries, completion events, and Unicode handling.
- Frontend lint: **passed**.
- Frontend production build: **passed** (with a chunk-size warning: the JavaScript bundle is 541.9 kB).
- Built frontend secret scan: **passed**; the configured OpenRouter key was not present in build output.

### Live API tests

The local server was exercised using the configured `OPENROUTER_API_KEY`. Chat, Summarizer, Quiz, and Planner each received HTTP **429** from OpenRouter after bounded retries. No real generation succeeded, so successful provider responses and generated content were **not** verified. The API returned friendly errors and did not expose raw provider details.

## Planner timeout investigation

The former Gemini Planner request had no explicit output-token cap. The OpenRouter implementation limits Planner output to 1,200 tokens and uses a 60-second upstream request timeout. The live Planner test received HTTP 429 in about two seconds, so it could not verify whether the earlier timeout is resolved. Vercel function duration may also depend on the deployment plan and configuration.

## Changed files in the worktree

- `server/config/ai.js`
- `server/services/openrouter.js`
- `server/controllers/api.controller.js`
- `server/controllers/api.controller.test.js`
- `server/index.js`
- `server/.env.example`
- `server/package.json`
- `server/package-lock.json`
- `client/src/pages/About.jsx`
- `README.md`
- `DEPLOYMENT_DIAGNOSIS.md`
- `GEMINI_MIGRATION_VERIFICATION.md`

## Environment variables

Set `OPENROUTER_API_KEY` in the **server runtime** (including Vercel's backend environment). Do not expose it as a `VITE_` frontend variable. `VITE_API_URL=/api` is documented for the frontend build and is optional when using the same-origin default.

`server/.env` was not modified and remains Git-ignored. No files were committed, pushed, staged, or deployed as part of this work.

## Remaining issue

Resolve or wait out OpenRouter's HTTP 429 response, then rerun the real API tests for Chat, Summarizer, Quiz, and Planner. Until then, only the mocked tests establish route behavior; live generation remains unverified.
