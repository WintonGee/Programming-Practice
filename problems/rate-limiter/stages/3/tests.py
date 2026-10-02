from harness import FakeClock, raises
from solution import RateLimiter


def test_raised_limit_for_one_client():
    """An override raises one client's limit; others keep the default."""
    limiter = RateLimiter(FakeClock(0), 2, 10)
    limiter.set_limit("vip", 4)
    assert [limiter.allow("vip") for _ in range(5)] == [True, True, True, True, False]
    assert [limiter.allow("free") for _ in range(3)] == [True, True, False]


def test_lowered_limit():
    """An override can also lower a client's limit."""
    limiter = RateLimiter(FakeClock(0), 5, 10)
    limiter.set_limit("a", 1)
    assert limiter.allow("a") is True
    assert limiter.allow("a") is False
    assert limiter.remaining("b") == 5


def test_override_before_any_request():
    """remaining reflects an override set before the client's first request."""
    limiter = RateLimiter(FakeClock(0), 2, 10)
    limiter.set_limit("new", 7)
    assert limiter.remaining("new") == 7


def test_override_replaces_previous_override():
    """Calling set_limit again replaces the earlier override."""
    limiter = RateLimiter(FakeClock(0), 2, 10)
    limiter.set_limit("a", 10)
    limiter.set_limit("a", 3)
    assert limiter.remaining("a") == 3


def test_lowering_below_usage_fixed():
    """Usage above the new limit blocks the client until the next window; remaining is 0."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 3, 10)
    limiter.allow("a")
    limiter.allow("a")
    limiter.allow("a")
    limiter.set_limit("a", 1)
    assert limiter.remaining("a") == 0
    assert limiter.allow("a") is False
    clock.set(10)
    assert limiter.remaining("a") == 1
    assert limiter.allow("a") is True


def test_lowering_below_usage_sliding():
    """Under the sliding strategy, old requests must expire below the new limit first."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 3, 10, strategy="sliding")
    for t in [0, 1, 2]:
        clock.set(t)
        limiter.allow("a")
    limiter.set_limit("a", 2)
    assert limiter.remaining("a") == 0
    clock.set(10)
    assert limiter.allow("a") is False
    clock.set(11)
    assert limiter.allow("a") is True


def test_stats_count_allowed_and_rejected():
    """get_stats returns (allowed, rejected) for the client's allow calls."""
    limiter = RateLimiter(FakeClock(0), 2, 10)
    for _ in range(5):
        limiter.allow("a")
    limiter.allow("b")
    assert limiter.get_stats("a") == (2, 3)
    assert limiter.get_stats("b") == (1, 0)


def test_stats_are_lifetime_totals():
    """Stats accumulate across windows instead of resetting."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 1, 10)
    limiter.allow("a")
    limiter.allow("a")
    clock.set(10)
    limiter.allow("a")
    limiter.allow("a")
    assert limiter.get_stats("a") == (2, 2)


def test_stats_unknown_client():
    """A client that never called allow has (0, 0), even with an override or remaining call."""
    limiter = RateLimiter(FakeClock(0), 2, 10)
    assert limiter.get_stats("ghost") == (0, 0)
    limiter.set_limit("ghost", 5)
    limiter.remaining("ghost")
    assert limiter.get_stats("ghost") == (0, 0)


def test_invalid_override_raises():
    """set_limit rejects limits below 1 and keeps the old limit."""
    limiter = RateLimiter(FakeClock(0), 2, 10)
    limiter.set_limit("a", 4)
    with raises(ValueError):
        limiter.set_limit("a", 0)
    with raises(ValueError):
        limiter.set_limit("a", -3)
    assert limiter.remaining("a") == 4
