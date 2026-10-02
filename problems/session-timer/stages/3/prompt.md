The platform now wants per-person reporting. Sessions can be attributed to a **contributor**.

### Changed operation

`open_session(session_id, at, contributor=None)` gains an optional third parameter: the contributor id (a string) who owns the session. Sessions opened without one are anonymous and are ignored by every contributor report below. Existing calls with two arguments must keep working.

### New operations

| Method | Behavior |
|---|---|
| `get_contributor_elapsed(contributor)` | Total tracked seconds across all of this contributor's sessions (open sessions measured to `clock.now()`, pauses excluded as before). Returns `0` for a contributor with no sessions. |
| `get_contributor_tasks(contributor)` | Number of **distinct** task ids this contributor completed across all of their sessions — the same `task_id` finished in two different sessions counts once. Returns `0` for an unknown contributor. |
| `top_contributors(n)` | The top `n` contributors by tracked seconds, as strings formatted `"<contributor>(<seconds>)"`. Sort by seconds **descending**, break ties by contributor id **ascending**. If fewer than `n` contributors exist, return them all. A contributor with a session counts even if their total is `0`. |

### Example

```python
clock = FakeClock(0)
timer = SessionTimer(clock)
timer.open_session("s1", 0, "alice")
timer.open_session("s2", 0, "bob")
timer.open_session("s3", 10, "alice")
timer.open_session("s4", 0)               # anonymous
timer.close_session("s1", 30)
timer.close_session("s2", 50)
clock.set(40)
timer.get_contributor_elapsed("alice")    # 60  (30 + 30, s3 still open)
timer.top_contributors(5)                 # ["alice(60)", "bob(50)"]
timer.top_contributors(1)                 # ["alice(60)"]
```
