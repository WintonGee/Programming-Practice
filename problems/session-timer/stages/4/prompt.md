Payroll disputes are coming in, and support needs to answer questions about the **past**: "how much had this session tracked by 3pm?" Your timer must now answer point-in-time queries, which means remembering *when* things happened, not just running totals.

### New operations

| Method | Behavior |
|---|---|
| `get_session_elapsed_at(session_id, at)` | Active (unpaused) seconds the session had tracked as of timestamp `at`. Returns `0` if `at` is before the session opened. A stretch still running is measured up to `at`. Raise `KeyError` if unknown. |
| `get_contributor_elapsed_at(contributor, at)` | Sum of `get_session_elapsed_at` over the contributor's sessions. `0` for an unknown contributor. |
| `get_tasks_completed_between(session_id, start, end)` | Number of distinct tasks whose **first** completion in this session happened in `[start, end)` — start inclusive, end exclusive. Raise `KeyError` if unknown. |

Everything from Stages 1–3 still applies. `at` may be any integer — before the session opened, in the middle of a pause, after it closed, or later than `clock.now()`.

### Example

```python
timer = SessionTimer(FakeClock(0))
timer.open_session("s1", 100, "alice")
timer.pause_session("s1", 130)        # active 100..130
timer.resume_session("s1", 200)
timer.close_session("s1", 220)        # active 200..220
timer.get_session_elapsed_at("s1", 50)    # 0
timer.get_session_elapsed_at("s1", 115)   # 15
timer.get_session_elapsed_at("s1", 160)   # 30  (paused)
timer.get_session_elapsed_at("s1", 210)   # 40
timer.get_session_elapsed_at("s1", 999)   # 50  (closed)
```
