class Leaderboard:
    def __init__(self) -> None:
        raise NotImplementedError

    def add_score(self, player: str, points: int) -> int:
        # Add points to the player's total and return the new total
        raise NotImplementedError

    def get_score(self, player: str) -> int:
        # The player's current total, or 0 if they aren't on the board
        raise NotImplementedError

    def reset(self, player: str) -> None:
        # Take the player off the board (no error if they aren't on it)
        raise NotImplementedError


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, Leaderboard!")


if __name__ == "__main__":
    main()
