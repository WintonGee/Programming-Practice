Contributors take breaks. Paused time must **not** count toward a session's tracked time. Add two methods and update the existing ones.

### New operations

| Method | Behavior |
|---|---|
| `pause_session(session_id, at)` | Stop the clock for this session at `at`. Raise `KeyError` if unknown, `ValueError` if the session is already paused or closed. |
| `resume_session(session_id, at)` | Restart the clock at `at`. Raise `KeyError` if unknown, `ValueError` if the session is not currently paused. |

### Changed behavior

- `get_session_elapsed` now returns only **active** (unpaused) seconds. If the session is currently paused, it does not grow while `clock.now()` advances.
- `close_session` is allowed on a paused session. The session ends at its pause time — the paused stretch is never counted.
- `complete_task` on a paused session raises `ValueError` (nobody finishes work during a break).

A session can be paused and resumed any number of times. All Stage 1 behavior still applies — your Stage 1 tests keep running.

### Example

```python
clock = FakeClock(0)
timer = SessionTimer(clock)
timer.open_session("s1", 0)
timer.pause_session("s1", 30)
clock.set(100)
timer.get_session_elapsed("s1")    # 30  (paused: frozen)
timer.resume_session("s1", 100)
clock.set(120)
timer.get_session_elapsed("s1")    # 50  (30 + 20)
timer.pause_session("s1", 130)
timer.close_session("s1", 200)
timer.get_session_elapsed("s1")    # 60  (30 + 30)
```
