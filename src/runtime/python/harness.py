"""Helpers importable from problem test files as `from harness import ...`."""

from contextlib import contextmanager


class FakeClock:
    """Deterministic clock. Tests control time explicitly; nothing reads the wall clock."""

    def __init__(self, start: int = 0) -> None:
        self._now = start

    def now(self) -> int:
        return self._now

    def set(self, t: int) -> None:
        self._now = t

    def advance(self, seconds: int) -> None:
        self._now += seconds


class _Raised:
    value = None


@contextmanager
def raises(expected):
    """Assert the block raises `expected` (an exception type or tuple of types)."""
    info = _Raised()
    try:
        yield info
    except expected as exc:
        info.value = exc
        return
    except Exception as exc:
        names = _names(expected)
        raise AssertionError(
            f"expected {names} to be raised, but got {type(exc).__name__}: {exc}"
        ) from None
    raise AssertionError(f"expected {_names(expected)} to be raised, but nothing was raised")


def _names(expected) -> str:
    if isinstance(expected, tuple):
        return " or ".join(e.__name__ for e in expected)
    return expected.__name__
