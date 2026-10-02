import time
from typing import Protocol


class Clock(Protocol):
    def now(self) -> int: ...


class SystemClock:
    def now(self) -> int:
        return int(time.time())


class RateLimiter:
    def __init__(self, clock: Clock, limit: int, window_seconds: int) -> None:
        # At most `limit` allowed requests per client per window of `window_seconds`
        raise NotImplementedError

    def allow(self, client_id: str) -> bool:
        # A request arrives now (clock.now()). True if it may proceed, False if throttled
        raise NotImplementedError


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, RateLimiter!")


if __name__ == "__main__":
    main()
