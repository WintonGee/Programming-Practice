The game's lobby screen wants to show who's winning. Add two ranking queries.

A player is **on the board** from their first `add_score` call (even one with `0` points) until they are `reset`. Players on the board count in rankings even if their total is `0` or negative. Players who were never added, or who were reset and haven't scored since, do not appear.

### New operations

| Method | Behavior |
|---|---|
| `top(k)` | The top `k` players on the board as strings formatted `"<player>(<score>)"`, e.g. `"ann(15)"` or `"bob(-3)"`. Sort by score **descending**, break ties by player name **ascending**. If fewer than `k` players are on the board, return them all. `k` is never negative; `top(0)` returns `[]`. |
| `rank(player)` | The player's 1-based rank: `1 +` the number of players on the board with a **strictly higher** score. Tied players share the better rank and the next rank is skipped ("competition ranking": scores 50, 40, 40, 10 rank 1, 2, 2, 4). Returns `None` if the player isn't on the board. |

All Stage 1 behavior still applies — your Stage 1 tests keep running.

### Example

```python
board = Leaderboard()
board.add_score("dan", 50)
board.add_score("bob", 40)
board.add_score("amy", 40)
board.add_score("cat", 10)
board.top(3)          # ["dan(50)", "amy(40)", "bob(40)"]
board.rank("dan")     # 1
board.rank("bob")     # 2
board.rank("amy")     # 2
board.rank("cat")     # 4
board.rank("eve")     # None
board.reset("dan")
board.top(10)         # ["amy(40)", "bob(40)", "cat(10)"]
board.rank("amy")     # 1
```
