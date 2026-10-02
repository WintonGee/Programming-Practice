# Authoring a problem

A problem is a directory under `problems/`. The site discovers it automatically.

```
problems/<slug>/
  problem.json          title, difficulty, order, tags, summary, estimatedMinutes
  starter.py            stage-1 skeleton; every method raises NotImplementedError
  stages/
    1/
      prompt.md         markdown shown for this stage (no top-level heading)
      stage.json        {"title": "...", "hints": ["...", "..."]}
      tests.py          the tests this stage adds
      solution.py       a full reference solution passing stages 1..this one
    2/ ...
```

## Rules

- **Stages are cumulative.** Stage *N* is graded on the tests of stages 1..*N*. Stage 2+ prompts describe only what is new or changed.
- **Every checked behavior is stated in a prompt.** Return-vs-raise, ordering, tie-breaks, inclusive/exclusive bounds — if a test checks it, a prompt says it.
- **Deterministic.** No randomness, no wall clock. Time-dependent APIs take explicit timestamps or an injected clock; tests use `FakeClock`.
- **Tests read well in the UI.** Each `test_*` function has a one-line docstring (shown as the test's description). Write `assert actual == expected` with the actual value on the left — the runner reports `expected <right>, got <left>`. Use `with raises(ValueError):` for errors. Helpers must not start with `test_`.
- **Hints are progressive**: a nudge, then a concrete technique, then something close to the answer.

## Verify

```sh
pnpm verify:problems              # all problems
node scripts/verify-problems.mjs <slug>
```

This runs the content in the same Pyodide runtime as the browser and checks that the starter fails stage 1, each stage's solution passes stages 1..N, and each stage's solution fails the next stage (so every stage adds real work).
