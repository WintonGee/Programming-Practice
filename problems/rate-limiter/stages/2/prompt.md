Fixed windows have a known flaw: a client can send `limit` requests at the end of one window and `limit` more at the start of the next — double the quota within a couple of seconds. Add a **sliding window** strategy, and let clients ask how much quota they have left.

### Changed constructor

`RateLimiter(clock, limit, window_seconds, strategy="fixed")` gains an optional `strategy`:

- `"fixed"` (the default) — exactly the Stage 1 behavior. Existing calls without `strategy` must keep working.
- `"sliding"` — a rolling window, described below.

Raise `ValueError` for any other `strategy` value.

### Sliding window

A request at time `now` is allowed if the client has fewer than `limit` allowed requests with timestamps in `(now - window_seconds, now]` — the lower bound is **exclusive**. In other words, an allowed request made at time `t` stops counting at exactly `t + window_seconds`. There is no alignment to multiples; the window moves with the clock. Rejected requests are still never counted.

### New operations

| Method | Behavior |
|---|---|
| `remaining(client_id)` | How many more requests from this client would be allowed if they all arrived right now, under the limiter's strategy: `limit` minus the client's counted requests in the current window. A client that has never made a request has `limit` remaining. Calling `remaining` never counts as a request. |

All Stage 1 behavior still applies.

### Example

```python
clock = FakeClock(8)
limiter = RateLimiter(clock, limit=2, window_seconds=10, strategy="sliding")
limiter.allow("a")       # True   (counts until t=18)
clock.set(9)
limiter.allow("a")       # True   (counts until t=19)
limiter.remaining("a")   # 0
clock.set(10)
limiter.allow("a")       # False  (no reset at 10 — both requests still count)
clock.set(18)
limiter.remaining("a")   # 1      (the t=8 request expired)
limiter.allow("a")       # True
limiter.allow("a")       # False
```
