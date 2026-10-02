---
name: new-problem
description: Generate one or more new staged interview problems for the Staged practice site (problems/<slug>/), proven by the Pyodide verifier, an independent content review, and a full-UI e2e solve. Use when the user asks to add, generate, or create practice problems/tasks/questions, optionally naming a theme, slug, difficulty, or count.
---

# New staged problem

A problem is one Python class whose API grows over 3–4 stages. Stage N is graded on the tests of stages 1..N. The learner's code carries over between stages. Read `docs/AUTHORING.md` for the file format; this skill is the full workflow, and a problem is not done until every gate below passes.

Arguments (all optional): a theme or slug, a difficulty, a stage count, a number of problems. With no theme, take the first unchecked idea in `docs/problem-ideas.md`.

## 1. Load context (every time)

- Read `docs/AUTHORING.md` and `docs/problem-ideas.md`.
- Read **every** file of the exemplar `problems/session-timer/` (problem.json, starter.py, and each stage's prompt.md, stage.json, tests.py, solution.py). New problems mirror its structure, tone, prompt format, test style, and hint ladder.
- Read `src/runtime/python/harness.py` (`FakeClock`, `raises`) and skim `src/runtime/python/runner.py` (how failures are reported).
- List `problems/` so you don't duplicate a slug or a theme.

## 2. Design the arc before writing files

Write a short plan: class name, then for each stage its title, new/changed methods with full signatures, and the one idea that stage adds. A good arc:

- **Stage 1** is approachable in 15–20 minutes: a dict plus validation.
- **Each later stage forces a new data structure or a refactor** (an index, a heap, intervals, an event log, snapshots), not just one more method. The last stage usually needs history ("as of time t") or undo, which punishes stage-1 shortcuts.
- **Realistic signatures and conventions**: CodeSignal-style problems usually return `None`/`False` for invalid operations; CoderPad-style ones usually raise. Pick one per problem and state it.
- **Time** comes from explicit integer timestamps or an injected clock (`FakeClock`). Never the wall clock. Money is integer cents.
- Easy problems: 3 stages, gentle stage 1. Medium: 4 stages. Hard: 4 stages with a demanding final stage.

## 3. Scaffold

```sh
pnpm new-problem <slug> --title "<Title>" --class <ClassName> --stages <n> --difficulty <Easy|Medium|Hard>
```

This creates every file with `TODO(author)` placeholders. The verifier rejects any file still containing one.

## 4. Author every file

- `problem.json`: real tags (3–4), a summary hinting at the evolution, an honest `estimatedMinutes`.
- `starter.py`: the stage-1 skeleton. Every method raises `NotImplementedError` with a one-line comment. `main()` only prints a hello line and must not construct the class.
- `stages/N/prompt.md`: no top-level heading. Open with an intro paragraph (stage 1) or what changed (later stages), then an `### Operations` table (Method | Behavior), optionally `### Rules`, then an `### Example` python block with results as comments. Later stages say "All Stage 1–(N-1) behavior still applies."
- `stages/N/stage.json`: a short title and 3–4 progressive hints (nudge, then technique, then near-solution). Inline `code` is fine.
- `stages/N/tests.py`: 8–12 `def test_*():` functions. Each has a one-line docstring, which the UI shows as the test's description.
  - Write `assert actual == expected`, with the actual value on the left.
  - Check errors with `with raises(ValueError):`.
  - Helpers must not start with `test_`.
  - Cover edge cases on purpose: empty input, zero, ties, inclusive/exclusive boundaries, unknown ids, idempotency, ordering.
  - Keep it deterministic: no randomness, and no reliance on dict ordering unless the spec defines it.
- `stages/N/solution.py`: a complete standalone reference passing stages 1..N. Write it the way you'd want a learner to study it: idiomatic, dataclasses and type hints, Python 3.11-compatible, no cleverness. It evolves from the previous stage's solution.
- **Every behavior a test checks must be stated in that stage's prompt or an earlier one.** In interview mode the learner sees only prompts, so an unstated rule is a bug.

## 5. Gate: verifier

```sh
node scripts/verify-problems.mjs <slug>
```

This must print `All 1 problems verified.` It checks four things:
- no placeholders remain
- the starter fails stage 1
- each stage's solution passes stages 1..N
- each stage's solution fails at least one test of the next stage

It runs in the same Pyodide runtime as the browser. Fix the content and rerun; never weaken a test just to make the gate pass.

## 6. Gate: independent content review

Spawn a `reviewer` agent (or a fresh general-purpose agent) with this brief, replacing <slug>:

> Review problems/<slug>/ (compare format with problems/session-timer/; runner semantics in src/runtime/python/runner.py). The verifier already proves solutions agree with tests. Find:
> (a) a test checking behavior not stated in any prompt up to that stage;
> (b) prompt examples whose stated results are wrong;
> (c) ambiguous wording that admits two reasonable implementations where the tests pick one;
> (d) tests over-coupled to an implementation;
> (e) wrong or misleading hints;
> (f) unidiomatic or overcomplicated reference solutions.
> Probe ambiguity by writing alternative implementations and running them through the runner. For each finding give file:line, a concrete failing scenario, and the minimal fix. Do not edit files.

Fix every (a)–(c) finding. Fix (d)–(f) unless there is a stated reason not to. Rerun step 5.

## 7. Gate: solve it through the real UI

```sh
pnpm exec playwright test full-solve -g <slug>
```

This builds the site and walks every stage in a browser: copy the solution, paste it, run the tests, continue to the next stage. It must pass.

## 8. Finish

- Mark the idea `[x]` with its slug in `docs/problem-ideas.md` (add it under Shipped if it wasn't listed).
- Run `pnpm check` (typecheck, lint, unit tests, all problems verified).
- Commit on a branch (never directly on `main` unless the user says so).
- Deploy only if the user asked: `pnpm run deploy`. Deploy reruns the verifier first. Then confirm with `pnpm exec playwright test full-solve -g <slug>` using `E2E_BASE_URL=https://coding.wintongee.com`.
- Report: the slug, stage titles, test counts per stage, spec decisions made, review findings fixed, and gate results.

## Several problems at once

Author in parallel with at most 2–3 `builder` agents, one slug each, so no two agents share a directory. Give each this skill's steps 1–5 verbatim as its brief, plus its assigned idea. Run steps 6–8 yourself per problem as each finishes. Playwright runs one at a time, never in parallel.
