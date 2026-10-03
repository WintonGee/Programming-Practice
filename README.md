# Staged

Practice for **progressive coding interviews** — the CodeSignal / CoderPad format where you implement one class, pass its tests, and then the interviewer *evolves* the requirements in the next stage while the earlier tests keep running.

Python executes in the browser in [Pyodide](https://pyodide.org) inside a web worker, so grading is deterministic, offline-capable, and needs no backend. Progress lives in `localStorage`. The Teacher chat calls a small Cloudflare Worker API (`worker/`, `/api/tutor`) backed by Workers AI.

Live at **https://coding.wintongee.com** (a Cloudflare Worker serving static assets plus `/api/*`).

## How it works

- Each problem has 3–4 **stages**. Stage *N* is graded against the tests of stages 1..*N*, so a refactor that breaks old behavior fails immediately — exactly like the real thing.
- Your code carries over between stages. Nothing resets.
- **Practice mode**: progressive hints, the test source, and a reference solution per stage.
- **Interview mode**: a countdown, no hints/tests/solutions — just the prompt and the results.
- Time is never read from the wall clock in tests. Problems that care about time take an injected clock (`FakeClock` from `harness`), so every run is reproducible.

## Develop

Requires Node 22.18+ (or 23.6+): `scripts/verify-problems.mjs` imports TypeScript sources directly and relies on Node's built-in type stripping.

```sh
pnpm install
pnpm dev                 # copies the Pyodide runtime into public/pyodide, then starts Vite
pnpm dev:api             # production build + wrangler dev on :8787 (Worker API with the built site)
pnpm check               # typecheck + lint + unit tests + content verification
pnpm e2e                 # Playwright end-to-end tests against a local production build
pnpm e2e:prod            # the same suite against https://coding.wintongee.com
```

## Deploy

```sh
pnpm run deploy            # build + wrangler deploy (custom domain coding.wintongee.com)
```

`wrangler.jsonc` runs `worker/index.ts` for `/api/*` (the tutor: rate-limited, Workers AI via AI Gateway) and serves everything else from `dist/` as static assets with SPA fallback. It also attaches the `coding.wintongee.com` custom domain (the zone is already on Cloudflare; the first deploy creates the DNS record).

## Layout

```
problems/<slug>/              problem content (see docs/AUTHORING.md)
src/runtime/python/           harness.py (FakeClock, raises) + runner.py (test runner)
src/runtime/worker.ts         Pyodide web worker
src/runtime/runner.ts         main-thread client with timeout + restart
src/problems/                 content loader (import.meta.glob)
src/tutor/                    Teacher chat client, context and history
worker/                       Cloudflare Worker: /api/tutor (Workers AI, rate limit, SSE)
scripts/verify-problems.mjs   proves every problem in Node + Pyodide
```

## Adding problems

In Claude Code, run `/new-problem` (optionally with a theme, difficulty, or count) to generate problems end to end: design, author, verify in Pyodide, independent review, and a full UI solve. Ideas live in [docs/problem-ideas.md](docs/problem-ideas.md).

By hand: `pnpm new-problem <slug> --title "..." --class ClassName`, then fill every `TODO(author)` per [docs/AUTHORING.md](docs/AUTHORING.md). `pnpm verify:problems` must pass before a problem ships, and `pnpm run deploy` runs it first.
