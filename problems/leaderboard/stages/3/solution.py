from bisect import bisect_right
from dataclasses import dataclass, field


@dataclass
class History:
    # Parallel lists: the timestamp of each change and the running total right after it.
    times: list[int] = field(default_factory=list)
    totals: list[int] = field(default_factory=list)

    def record(self, at: int, points: int) -> int:
        total = (self.totals[-1] if self.totals else 0) + points
        self.times.append(at)
        self.totals.append(total)
        return total

    def current(self) -> int:
        return self.totals[-1]

    def total_at(self, at: int) -> int | None:
        i = bisect_right(self.times, at)
        return self.totals[i - 1] if i else None


class Leaderboard:
    def __init__(self) -> None:
        self.history: dict[str, History] = {}
        self.latest = 0

    def add_score_at(self, player: str, points: int, at: int) -> int:
        if at < self.latest:
            raise ValueError(f"timestamp {at} is before {self.latest}")
        self.latest = at
        return self.history.setdefault(player, History()).record(at, points)

    def add_score(self, player: str, points: int) -> int:
        return self.add_score_at(player, points, self.latest)

    def get_score(self, player: str) -> int:
        history = self.history.get(player)
        return history.current() if history else 0

    def reset(self, player: str) -> None:
        self.history.pop(player, None)

    def score_at(self, player: str, at: int) -> int:
        history = self.history.get(player)
        total = history.total_at(at) if history else None
        return 0 if total is None else total

    def top(self, k: int) -> list[str]:
        return _format_top({p: h.current() for p, h in self.history.items()}, k)

    def top_at(self, k: int, at: int) -> list[str]:
        totals = {}
        for player, history in self.history.items():
            total = history.total_at(at)
            if total is not None:
                totals[player] = total
        return _format_top(totals, k)

    def rank(self, player: str) -> int | None:
        if player not in self.history:
            return None
        mine = self.get_score(player)
        return 1 + sum(1 for h in self.history.values() if h.current() > mine)


def _format_top(totals: dict[str, int], k: int) -> list[str]:
    ranked = sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))
    return [f"{player}({score})" for player, score in ranked[:k]]
