from harness import FakeClock, raises
from solution import RateLimiter


def test_default_strategy_is_fixed():
    """Without a strategy, and with strategy="fixed", windows stay aligned."""
    clock = FakeClock(9)
    implicit = RateLimiter(clock, 1, 10)
    explicit = RateLimiter(clock, 1, 10, strategy="fixed")
    assert implicit.allow("a") is True
    assert explicit.allow("a") is True
    clock.set(10)
    assert implicit.allow("a") is True
    assert explicit.allow("a") is True


def test_sliding_lower_bound_is_exclusive():
    """A request at t stops counting at exactly t + window_seconds."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 1, 10, strategy="sliding")
    assert limiter.allow("a") is True
    clock.set(9)
    assert limiter.allow("a") is False
    clock.set(10)
    assert limiter.allow("a") is True


def test_sliding_ignores_alignment():
    """The sliding window does not reset at multiples of window_seconds."""
    clock = FakeClock(8)
    limiter = RateLimiter(clock, 2, 10, strategy="sliding")
    assert limiter.allow("a") is True
    clock.set(9)
    assert limiter.allow("a") is True
    clock.set(10)
    assert limiter.allow("a") is False
    clock.set(18)
    assert limiter.allow("a") is True
    assert limiter.allow("a") is False
    clock.set(19)
    assert limiter.allow("a") is True


def test_sliding_rejections_not_counted():
    """Rejected requests never extend how long a client is blocked."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 1, 10, strategy="sliding")
    limiter.allow("a")
    for t in range(1, 10):
        clock.set(t)
        assert limiter.allow("a") is False
    clock.set(10)
    assert limiter.allow("a") is True


def test_sliding_clients_independent():
    """Each client has its own rolling log."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 1, 10, strategy="sliding")
    assert limiter.allow("a") is True
    clock.set(5)
    assert limiter.allow("b") is True
    clock.set(10)
    assert limiter.allow("a") is True
    assert limiter.allow("b") is False


def test_remaining_for_new_client():
    """A client with no requests has the full limit remaining, under either strategy."""
    clock = FakeClock(0)
    assert RateLimiter(clock, 4, 10).remaining("new") == 4
    assert RateLimiter(clock, 4, 10, strategy="sliding").remaining("new") == 4


def test_remaining_does_not_consume():
    """remaining counts down with allowed requests, stops at 0, and never uses quota."""
    limiter = RateLimiter(FakeClock(0), 2, 10, strategy="sliding")
    assert limiter.remaining("a") == 2
    assert limiter.remaining("a") == 2
    limiter.allow("a")
    assert limiter.remaining("a") == 1
    limiter.allow("a")
    limiter.allow("a")
    assert limiter.remaining("a") == 0
    assert limiter.remaining("a") == 0


def test_remaining_sliding_recovers_gradually():
    """Under the sliding strategy, quota comes back one request at a time."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 3, 10, strategy="sliding")
    for t in [0, 2, 4]:
        clock.set(t)
        limiter.allow("a")
    clock.set(9)
    assert limiter.remaining("a") == 0
    clock.set(10)
    assert limiter.remaining("a") == 1
    clock.set(12)
    assert limiter.remaining("a") == 2
    clock.set(14)
    assert limiter.remaining("a") == 3


def test_remaining_fixed_resets_at_boundary():
    """Under the fixed strategy, quota comes back all at once at the next window."""
    clock = FakeClock(3)
    limiter = RateLimiter(clock, 3, 10)
    limiter.allow("a")
    limiter.allow("a")
    assert limiter.remaining("a") == 1
    clock.set(9)
    assert limiter.remaining("a") == 1
    clock.set(10)
    assert limiter.remaining("a") == 3


def test_unknown_strategy_raises():
    """Only "fixed" and "sliding" are valid strategies."""
    with raises(ValueError):
        RateLimiter(FakeClock(0), 1, 10, strategy="leaky")
