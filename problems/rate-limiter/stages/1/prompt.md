You're protecting a public API from clients that send too many requests. Every incoming request is checked against its client's quota before it is served. Implement `RateLimiter`.

The limiter receives a `clock` in its constructor. **Never call `time.time()` directly** — always ask `self.clock.now()` for the current time (integer seconds). The tests pass in a fake clock so they control time precisely. Time never goes backwards.

### Constructor

`RateLimiter(clock, limit, window_seconds)` — each client may have at most `limit` **allowed** requests per window of `window_seconds` seconds. Raise `ValueError` if `limit < 1` or `window_seconds < 1`.

### Operations

| Method | Behavior |
|---|---|
| `allow(client_id)` | A request from `client_id` arrives at `clock.now()`. If the client has fewer than `limit` allowed requests in the current window, count this one and return `True`. Otherwise return `False`. **Rejected requests are never counted.** |

### Fixed windows

Windows are aligned to multiples of `window_seconds`, **not** to a client's first request. With `window_seconds = 10` the windows are `[0, 10)`, `[10, 20)`, `[20, 30)`, … — a request at time `t` belongs to window number `t // window_seconds`. When a new window starts, every client's count starts over at zero. Each client has its own independent quota.

### Example

```python
clock = FakeClock(8)
limiter = RateLimiter(clock, limit=2, window_seconds=10)
limiter.allow("a")    # True
limiter.allow("a")    # True
limiter.allow("a")    # False  (window [0, 10) is full)
limiter.allow("b")    # True   (separate quota)
clock.set(10)
limiter.allow("a")    # True   (new window [10, 20))
```
