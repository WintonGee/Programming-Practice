class Leaderboard:
    def __init__(self) -> None:
        self.scores: dict[str, int] = {}

    def add_score(self, player: str, points: int) -> int:
        self.scores[player] = self.scores.get(player, 0) + points
        return self.scores[player]

    def get_score(self, player: str) -> int:
        return self.scores.get(player, 0)

    def reset(self, player: str) -> None:
        self.scores.pop(player, None)

    def top(self, k: int) -> list[str]:
        ranked = sorted(self.scores.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{player}({score})" for player, score in ranked[:k]]

    def rank(self, player: str) -> int | None:
        if player not in self.scores:
            return None
        mine = self.scores[player]
        return 1 + sum(1 for score in self.scores.values() if score > mine)
