Paying customers get bigger quotas, and support wants to see how often each client is being throttled. Add per-client limits and per-client statistics.

### New operations

| Method | Behavior |
|---|---|
| `set_limit(client_id, limit)` | Override the limit for one client. Other clients keep the constructor's default. Calling it again replaces the previous override. Works for clients that have never made a request. Raise `ValueError` if `limit < 1`. |
| `get_stats(client_id)` | A tuple `(allowed, rejected)`: how many of this client's `allow` calls returned `True` and `False`, over the limiter's whole lifetime (not per window). Returns `(0, 0)` for a client that has never called `allow`. |

### Rules

- A client's **effective limit** is their override if one was set, otherwise the default. `allow` and `remaining` use the effective limit.
- An override takes effect **immediately** and applies to requests already counted in the current window. If a client has already used more than their new limit, their requests are rejected until enough old ones expire (or the next fixed window starts), and `remaining` returns `0` — never a negative number.
- `remaining` and `set_limit` do not change stats.

All Stage 1 and 2 behavior still applies, for both strategies.

### Example

```python
clock = FakeClock(0)
limiter = RateLimiter(clock, limit=2, window_seconds=10)
limiter.set_limit("vip", 5)
limiter.remaining("vip")      # 5
limiter.remaining("free")     # 2
for _ in range(3):
    limiter.allow("free")     # True, True, False
limiter.get_stats("free")     # (2, 1)
limiter.set_limit("free", 1)
limiter.remaining("free")     # 0   (used 2, new limit 1)
limiter.get_stats("nobody")   # (0, 0)
```
