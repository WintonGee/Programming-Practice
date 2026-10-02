import time
from collections import deque
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Protocol


class Clock(Protocol):
    def now(self) -> int: ...


class SystemClock:
    def now(self) -> int:
        return int(time.time())


class Strategy(StrEnum):
    FIXED = "fixed"
    SLIDING = "sliding"


@dataclass
class FixedWindow:
    window_seconds: int
    index: int | None = None
    count: int = 0

    def used(self, now: int) -> int:
        return self.count if now // self.window_seconds == self.index else 0

    def record(self, now: int) -> None:
        index = now // self.window_seconds
        if index != self.index:
            self.index, self.count = index, 0
        self.count += 1


@dataclass
class SlidingLog:
    window_seconds: int
    log: deque[int] = field(default_factory=deque)

    def used(self, now: int) -> int:
        while self.log and self.log[0] <= now - self.window_seconds:
            self.log.popleft()
        return len(self.log)

    def record(self, now: int) -> None:
        self.log.append(now)


@dataclass
class Stats:
    allowed: int = 0
    rejected: int = 0


class RateLimiter:
    def __init__(self, clock: Clock, limit: int, window_seconds: int, strategy: str = "fixed") -> None:
        if limit < 1 or window_seconds < 1:
            raise ValueError("limit and window_seconds must be at least 1")
        self.clock = clock
        self.limit = limit
        self.window_seconds = window_seconds
        self.strategy = Strategy(strategy)
        self.clients: dict[str, FixedWindow | SlidingLog] = {}
        self.limits: dict[str, int] = {}
        self.stats: dict[str, Stats] = {}

    def _client(self, client_id: str) -> FixedWindow | SlidingLog:
        if client_id not in self.clients:
            kind = FixedWindow if self.strategy is Strategy.FIXED else SlidingLog
            self.clients[client_id] = kind(self.window_seconds)
        return self.clients[client_id]

    def _limit(self, client_id: str) -> int:
        return self.limits.get(client_id, self.limit)

    def allow(self, client_id: str) -> bool:
        now = self.clock.now()
        client = self._client(client_id)
        stats = self.stats.setdefault(client_id, Stats())
        if client.used(now) >= self._limit(client_id):
            stats.rejected += 1
            return False
        client.record(now)
        stats.allowed += 1
        return True

    def remaining(self, client_id: str) -> int:
        return max(0, self._limit(client_id) - self._client(client_id).used(self.clock.now()))

    def set_limit(self, client_id: str, limit: int) -> None:
        if limit < 1:
            raise ValueError("limit must be at least 1")
        self.limits[client_id] = limit

    def get_stats(self, client_id: str) -> tuple[int, int]:
        stats = self.stats.get(client_id, Stats())
        return (stats.allowed, stats.rejected)
