You're building the scoreboard for an online game. Players earn points (and sometimes lose them) during a match, and the game keeps asking the board for scores. Implement `Leaderboard`.

### Operations

| Method | Behavior |
|---|---|
| `add_score(player, points)` | Add `points` to the player's total and return the **new total**. A player who has never scored starts from `0`. `points` may be zero or negative (penalties). Calling this puts the player **on the board**. |
| `get_score(player)` | The player's current total. Returns `0` for a player who isn't on the board. |
| `reset(player)` | Take the player off the board. Their score reads as `0` again, and the next `add_score` starts from `0`. Does nothing if the player isn't on the board (no error). |

Player names are case-sensitive strings: `"Ann"` and `"ann"` are different players. Nothing in this stage raises an exception.

### Example

```python
board = Leaderboard()
board.add_score("ann", 10)     # 10
board.add_score("ann", 5)      # 15
board.add_score("bob", -3)     # -3  (penalty)
board.get_score("ann")         # 15
board.get_score("cat")         # 0   (never scored)
board.reset("ann")
board.get_score("ann")         # 0
board.add_score("ann", 2)      # 2   (starts over)
board.reset("zed")             # no error
```
