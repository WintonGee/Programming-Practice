from harness import FakeClock, raises
from solution import RateLimiter


def _bucket(limit=3, window_seconds=10, start=0):
    clock = FakeClock(start)
    return clock, RateLimiter(clock, limit, window_seconds, strategy="token_bucket")


def test_bucket_starts_full():
    """A new client can burst its whole limit immediately, then is rejected."""
    _, limiter = _bucket(limit=3)
    assert [limiter.allow("a") for _ in range(4)] == [True, True, True, False]


def test_fractional_refill_is_exact():
    """Tokens refill at limit per window_seconds, accumulating fractions exactly."""
    clock, limiter = _bucket(limit=3, window_seconds=10)
    assert limiter.allow("a", cost=3) is True
    clock.set(3)
    assert limiter.allow("a") is False
    clock.set(4)
    assert limiter.allow("a") is True
    clock.set(6)
    assert limiter.allow("a") is False
    clock.set(7)
    assert limiter.allow("a") is True


def test_bucket_capped_at_limit():
    """However long a client idles, it never holds more than `limit` tokens."""
    clock, limiter = _bucket(limit=2, window_seconds=10)
    limiter.allow("a")
    clock.set(10_000)
    assert limiter.remaining("a") == 2
    assert [limiter.allow("a") for _ in range(3)] == [True, True, False]


def test_remaining_rounds_down():
    """remaining reports whole tokens only; a new client reports the full limit."""
    clock, limiter = _bucket(limit=4, window_seconds=10)
    assert limiter.remaining("new") == 4
    limiter.allow("a", cost=4)
    clock.set(2)
    assert limiter.remaining("a") == 0
    clock.set(3)
    assert limiter.remaining("a") == 1
    clock.set(5)
    assert limiter.remaining("a") == 2


def test_cost_consumes_multiple_tokens():
    """A costly request uses several tokens; a rejected one uses none."""
    clock, limiter = _bucket(limit=5, window_seconds=5)
    assert limiter.allow("a", cost=4) is True
    assert limiter.allow("a", cost=2) is False
    assert limiter.remaining("a") == 1
    clock.set(1)
    assert limiter.allow("a", cost=2) is True
    assert limiter.remaining("a") == 0


def test_cost_above_limit_always_rejected():
    """A request costing more than the limit can never be allowed."""
    clock, limiter = _bucket(limit=3)
    assert limiter.allow("a", cost=4) is False
    clock.set(1_000)
    assert limiter.allow("a", cost=4) is False
    assert limiter.remaining("a") == 3


def test_invalid_cost_raises():
    """cost below 1 raises ValueError under every strategy and isn't counted."""
    for strategy in ["fixed", "sliding", "token_bucket"]:
        limiter = RateLimiter(FakeClock(0), 3, 10, strategy=strategy)
        with raises(ValueError):
            limiter.allow("a", cost=0)
        with raises(ValueError):
            limiter.allow("a", cost=-1)
        assert limiter.get_stats("a") == (0, 0)
        assert limiter.remaining("a") == 3


def test_cost_with_fixed_window():
    """Under the fixed strategy, cost counts as that many units of the window's quota."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 5, 10)
    assert limiter.allow("a", cost=3) is True
    assert limiter.allow("a", cost=3) is False
    assert limiter.allow("a", cost=2) is True
    assert limiter.remaining("a") == 0
    clock.set(10)
    assert limiter.remaining("a") == 5


def test_cost_with_sliding_window():
    """Under the sliding strategy, a request's units all expire together."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 4, 10, strategy="sliding")
    limiter.allow("a", cost=3)
    clock.set(5)
    limiter.allow("a")
    assert limiter.remaining("a") == 0
    clock.set(10)
    assert limiter.remaining("a") == 3
    clock.set(15)
    assert limiter.remaining("a") == 4


def test_stats_count_calls_not_cost():
    """Each allow call adds exactly one to allowed or rejected."""
    _, limiter = _bucket(limit=5)
    limiter.allow("a", cost=5)
    limiter.allow("a", cost=2)
    limiter.allow("a")
    assert limiter.get_stats("a") == (1, 2)


def test_set_limit_keeps_tokens_and_changes_rate():
    """Lowering: refill at the old rate up to now, cap at the new limit, refill at the new rate."""
    clock, limiter = _bucket(limit=4, window_seconds=4)
    limiter.allow("a", cost=4)
    clock.set(1)
    limiter.set_limit("a", 2)
    assert limiter.remaining("a") == 1
    clock.set(2)
    assert limiter.remaining("a") == 1
    clock.set(3)
    assert limiter.remaining("a") == 2
    clock.set(100)
    assert limiter.remaining("a") == 2


def test_raising_limit_does_not_refill():
    """Raising a limit keeps the current tokens; a client with no bucket starts full at the new limit."""
    clock, limiter = _bucket(limit=2, window_seconds=4)
    limiter.allow("a", cost=2)
    clock.set(2)
    limiter.set_limit("a", 8)
    assert limiter.remaining("a") == 1
    clock.set(3)
    assert limiter.remaining("a") == 3
    limiter.set_limit("b", 8)
    assert limiter.allow("b", cost=8) is True
