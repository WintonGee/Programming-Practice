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
