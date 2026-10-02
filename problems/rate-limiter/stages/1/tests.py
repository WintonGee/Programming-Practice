from harness import FakeClock, raises
from solution import RateLimiter


def test_allows_up_to_limit():
    """The first `limit` requests in a window are allowed, the next is rejected."""
    limiter = RateLimiter(FakeClock(0), 3, 60)
    assert limiter.allow("a") is True
    assert limiter.allow("a") is True
    assert limiter.allow("a") is True
    assert limiter.allow("a") is False
    assert limiter.allow("a") is False


def test_limit_of_one():
    """With limit 1, only the first request per window passes."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 1, 5)
    assert limiter.allow("a") is True
    assert limiter.allow("a") is False
    clock.set(5)
    assert limiter.allow("a") is True


def test_new_window_resets_count():
    """A full client is allowed again once the next window starts."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 2, 10)
    limiter.allow("a")
    limiter.allow("a")
    clock.set(9)
    assert limiter.allow("a") is False
    clock.set(10)
    assert limiter.allow("a") is True
    assert limiter.allow("a") is True
    assert limiter.allow("a") is False


def test_windows_aligned_to_multiples():
    """Windows start at multiples of window_seconds, not at the first request."""
    clock = FakeClock(8)
    limiter = RateLimiter(clock, 2, 10)
    assert limiter.allow("a") is True
    clock.set(9)
    assert limiter.allow("a") is True
    assert limiter.allow("a") is False
    clock.set(10)
    assert limiter.allow("a") is True


def test_window_start_and_end_boundaries():
    """Times 0 and window_seconds - 1 share a window; window_seconds starts a new one."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 1, 30)
    assert limiter.allow("a") is True
    clock.set(29)
    assert limiter.allow("a") is False
    clock.set(30)
    assert limiter.allow("a") is True
    clock.set(59)
    assert limiter.allow("a") is False


def test_clients_are_independent():
    """One client's usage never affects another's quota."""
    limiter = RateLimiter(FakeClock(0), 2, 10)
    limiter.allow("a")
    limiter.allow("a")
    assert limiter.allow("a") is False
    assert limiter.allow("b") is True
    assert limiter.allow("b") is True
    assert limiter.allow("b") is False


def test_skipping_windows():
    """After several idle windows the client has a full quota."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 2, 10)
    limiter.allow("a")
    limiter.allow("a")
    clock.set(75)
    assert limiter.allow("a") is True
    assert limiter.allow("a") is True
    assert limiter.allow("a") is False


def test_large_start_time():
    """Alignment holds for large timestamps too."""
    clock = FakeClock(1_000_005)
    limiter = RateLimiter(clock, 1, 10)
    assert limiter.allow("a") is True
    clock.set(1_000_009)
    assert limiter.allow("a") is False
    clock.set(1_000_010)
    assert limiter.allow("a") is True


def test_exactly_limit_every_window():
    """Each consecutive window allows exactly `limit` requests."""
    clock = FakeClock(0)
    limiter = RateLimiter(clock, 3, 5)
    for start in range(0, 25, 5):
        clock.set(start)
        results = [limiter.allow("a") for _ in range(5)]
        assert results == [True, True, True, False, False]


def test_invalid_configuration_raises():
    """limit and window_seconds must both be at least 1."""
    clock = FakeClock(0)
    with raises(ValueError):
        RateLimiter(clock, 0, 10)
    with raises(ValueError):
        RateLimiter(clock, 5, 0)
    with raises(ValueError):
        RateLimiter(clock, -1, 10)
