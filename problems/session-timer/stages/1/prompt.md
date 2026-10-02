You're building the time tracker behind a contributor platform. A contributor opens a **work session**, completes **tasks** inside it, and eventually closes it. Implement `SessionTimer`.

The timer receives a `clock` in its constructor. **Never call `time.time()` directly** — always ask `self.clock.now()` for the current time. The tests pass in a fake clock so they control time precisely.

### Operations

| Method | Behavior |
|---|---|
| `open_session(session_id, at)` | Start a session at timestamp `at`. Raise `ValueError` if `session_id` was already used (open *or* closed). |
| `close_session(session_id, at)` | End the session at `at`. Raise `KeyError` if the session doesn't exist, `ValueError` if it is already closed. |
| `complete_task(session_id, task_id, at)` | Record that `task_id` was finished. Completing the same `task_id` twice in one session counts **once**. Raise `KeyError` for an unknown session, `ValueError` if the session is closed. |
| `get_session_elapsed(session_id)` | Seconds tracked. Closed: `close - open`. Still open: `clock.now() - open`. Raise `KeyError` if unknown. |
| `get_tasks_completed(session_id)` | Number of distinct tasks completed. Raise `KeyError` if unknown. |

Timestamps are integers (seconds). For any single session, the `at` values you receive never go backwards.

### Example

```python
clock = FakeClock(100)
timer = SessionTimer(clock)
timer.open_session("s1", 100)
timer.complete_task("s1", "t1", 130)
timer.complete_task("s1", "t1", 140)   # duplicate: still 1 task
clock.set(160)
timer.get_session_elapsed("s1")         # 60  (open, so measured to now)
timer.close_session("s1", 190)
timer.get_session_elapsed("s1")         # 90
timer.get_tasks_completed("s1")         # 1
```
