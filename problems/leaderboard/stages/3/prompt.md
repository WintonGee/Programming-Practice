Players are disputing results ("I was winning at the 10-minute mark!"), so the board must answer questions about the **past**. Every score change now happens at a timestamp, and you need to remember those changes, not just the running totals.

Timestamps are non-negative integers. The board tracks the **latest timestamp** it has seen, which starts at `0`.

### New operations

| Method | Behavior |
|---|---|
| `add_score_at(player, points, at)` | Same as `add_score`, but the change happens at timestamp `at`. Returns the player's new current total. Raise `ValueError` if `at` is earlier than the board's latest timestamp (equal is fine); nothing changes when it raises. Otherwise `at` becomes the latest timestamp. |
| `score_at(player, at)` | The player's total counting only changes made at timestamps `<= at` (inclusive). Returns `0` if the player had no changes by then, or isn't on the board. `at` may be any integer, including past the latest timestamp. |
| `top_at(k, at)` | Like `top(k)`, but using each player's `score_at(player, at)`. A player appears only if they had at least one change at a timestamp `<= at`. Same format and ordering rules as `top`. |

### Changed behavior

- `add_score(player, points)` (no timestamp) now counts as a change made at the board's latest timestamp — `0` if nothing has been timestamped yet. It never moves the latest timestamp.
- `reset(player)` now also erases the player's **entire history**: afterwards `score_at` is `0` for every `at` and the player is absent from `top_at` until they score again.

All Stage 1 and 2 behavior still applies.

### Example

```python
board = Leaderboard()
board.add_score_at("ann", 10, 5)
board.add_score_at("bob", 7, 8)
board.add_score_at("ann", -4, 12)
board.score_at("ann", 4)       # 0
board.score_at("ann", 5)       # 10  (inclusive)
board.score_at("ann", 11)      # 10
board.score_at("ann", 12)      # 6
board.top_at(5, 6)             # ["ann(10)"]  (bob hadn't scored yet)
board.top_at(5, 12)            # ["bob(7)", "ann(6)"]
board.add_score("bob", 1)      # 8  (recorded at timestamp 12)
board.add_score_at("cat", 3, 9)  # ValueError: 9 is before 12
```
