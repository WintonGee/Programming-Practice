Some endpoints are far more expensive than others, and well-behaved clients want to send short bursts after being idle. Add **weighted requests** and a **token bucket** strategy.

### Changed operation

`allow(client_id, cost=1)` gains an optional `cost`: how many units of quota this request uses. Existing one-argument calls must keep working. Raise `ValueError` if `cost < 1` (nothing is counted, stats unchanged).

- Under `"fixed"` and `"sliding"`, a request is allowed if the client's counted units in the current window plus `cost` is `<= limit`; if allowed, it counts as `cost` units (which, under `"sliding"`, all expire together at `t + window_seconds`). `remaining` reports units left.
- `get_stats` still counts **calls**, not units: one `allow` call adds exactly 1 to `allowed` or `rejected`.

### New strategy: `"token_bucket"`

`RateLimiter(clock, limit, window_seconds, strategy="token_bucket")`

- Each client has a bucket holding at most `limit` tokens (their effective limit). The bucket is created **full** the first time `allow` is called for that client.
- Tokens refill continuously at `limit` tokens per `window_seconds`: after `d` seconds a bucket gains exactly `d * limit / window_seconds` tokens. Fractional tokens accumulate exactly — no rounding — but the bucket never holds more than `limit`.
- A request is allowed if the bucket holds at least `cost` tokens; it then removes `cost` tokens. A rejected request removes nothing. A `cost` larger than the limit is always rejected.
- `remaining(client_id)` is the number of **whole** tokens in the bucket right now (rounded down). A client with no bucket yet has `limit` remaining.
- `set_limit` on a client whose bucket exists: first refill up to `clock.now()` at the **old** rate; then the bucket keeps its tokens, capped at the new limit, and refills at the new rate from then on. For a client with no bucket yet, the bucket is simply created full at the new limit on their first `allow`.

All Stage 1–3 behavior still applies.

### Example

```python
clock = FakeClock(0)
limiter = RateLimiter(clock, limit=3, window_seconds=10, strategy="token_bucket")
limiter.allow("a", cost=3)   # True   (burst: bucket started full, now 0)
clock.set(3)
limiter.allow("a")           # False  (0.9 tokens)
limiter.remaining("a")       # 0
clock.set(4)
limiter.allow("a")           # True   (1.2 tokens -> 0.2)
clock.set(7)
limiter.allow("a")           # True   (0.2 + 0.9 = 1.1 -> 0.1)
limiter.get_stats("a")       # (3, 1)
```
