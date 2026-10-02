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
    TOKEN_BUCKET = "token_bucket"


@dataclass
class FixedWindow:
    window_seconds: int
    index: int | None = None
    used: int = 0

    def available(self, now: int, limit: int) -> int:
        used = self.used if now // self.window_seconds == self.index else 0
        return max(0, limit - used)

    def consume(self, now: int, cost: int) -> None:
        index = now // self.window_seconds
        if index != self.index:
            self.index, self.used = index, 0
        self.used += cost


@dataclass
class SlidingLog:
    window_seconds: int
    log: deque[tuple[int, int]] = field(default_factory=deque)
    used: int = 0

    def available(self, now: int, limit: int) -> int:
        while self.log and self.log[0][0] <= now - self.window_seconds:
            _, cost = self.log.popleft()
            self.used -= cost
        return max(0, limit - self.used)

    def consume(self, now: int, cost: int) -> None:
        self.log.append((now, cost))
        self.used += cost


@dataclass
class TokenBucket:
    # Tokens are stored multiplied by window_seconds so refill stays exact integer math.
    window_seconds: int
    scaled: int | None = None
    refilled_at: int = 0

    def available(self, now: int, limit: int) -> int:
        capacity = limit * self.window_seconds
        if self.scaled is None:
            self.scaled = capacity
        else:
            self.scaled = min(capacity, self.scaled + (now - self.refilled_at) * limit)
        self.refilled_at = now
        return self.scaled // self.window_seconds

    def consume(self, now: int, cost: int) -> None:
        self.scaled -= cost * self.window_seconds


Bucket = FixedWindow | SlidingLog | TokenBucket

BUCKET_TYPES: dict[Strategy, type[Bucket]] = {
    Strategy.FIXED: FixedWindow,
    Strategy.SLIDING: SlidingLog,
    Strategy.TOKEN_BUCKET: TokenBucket,
}


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
        self.clients: dict[str, Bucket] = {}
        self.limits: dict[str, int] = {}
        self.stats: dict[str, Stats] = {}

    def _limit(self, client_id: str) -> int:
        return self.limits.get(client_id, self.limit)

    def allow(self, client_id: str, cost: int = 1) -> bool:
        if cost < 1:
            raise ValueError("cost must be at least 1")
        now = self.clock.now()
        if client_id not in self.clients:
            self.clients[client_id] = BUCKET_TYPES[self.strategy](self.window_seconds)
        client = self.clients[client_id]
        stats = self.stats.setdefault(client_id, Stats())
        if client.available(now, self._limit(client_id)) < cost:
            stats.rejected += 1
            return False
        client.consume(now, cost)
        stats.allowed += 1
        return True

    def remaining(self, client_id: str) -> int:
        client = self.clients.get(client_id)
        limit = self._limit(client_id)
        return limit if client is None else client.available(self.clock.now(), limit)

    def set_limit(self, client_id: str, limit: int) -> None:
        if limit < 1:
            raise ValueError("limit must be at least 1")
        if client_id in self.clients:
            # Settle any refill earned so far at the old limit before the new one applies.
            self.clients[client_id].available(self.clock.now(), self._limit(client_id))
        self.limits[client_id] = limit

    def get_stats(self, client_id: str) -> tuple[int, int]:
        stats = self.stats.get(client_id, Stats())
        return (stats.allowed, stats.rejected)
