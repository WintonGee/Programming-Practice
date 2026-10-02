import time
from dataclasses import dataclass
from typing import Protocol


class Clock(Protocol):
    def now(self) -> int: ...


class SystemClock:
    def now(self) -> int:
        return int(time.time())


@dataclass
class Window:
    index: int
    count: int = 0


class RateLimiter:
    def __init__(self, clock: Clock, limit: int, window_seconds: int) -> None:
        if limit < 1 or window_seconds < 1:
            raise ValueError("limit and window_seconds must be at least 1")
        self.clock = clock
        self.limit = limit
        self.window_seconds = window_seconds
        self.windows: dict[str, Window] = {}

    def allow(self, client_id: str) -> bool:
        index = self.clock.now() // self.window_seconds
        window = self.windows.get(client_id)
        if window is None or window.index != index:
            window = self.windows[client_id] = Window(index)
        if window.count >= self.limit:
            return False
        window.count += 1
        return True
