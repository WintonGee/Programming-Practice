Management wants reports, and security wants to know who was parked where last Tuesday. Your lot must now answer questions about the **past**, which means remembering every payment and every stay, not just what's in the lot right now.

### New operations

| Method | Behavior |
|---|---|
| `revenue(start, end)` | Total cents charged by `leave` calls whose timestamp is in `[start, end)` — start inclusive, end exclusive. Free stays add `0`. Returns `0` if there were none. |
| `occupant_at(spot_id, at)` | The plate that was in `spot_id` at minute `at`, or `None` if the spot was empty then or doesn't exist. |

### Rules

- A vehicle occupies its spot from its `park` timestamp (inclusive) to its `leave` timestamp (exclusive). So at the minute a vehicle leaves, the spot is already empty — and a vehicle that parks there in that same minute is the occupant.
- A vehicle that hasn't left yet occupies its spot for every `at` from its `park` timestamp onward, including times later than the latest call.
- `at`, `start` and `end` may be any integers.

All Stage 1–3 behavior still applies.

### Example

```python
lot = ParkingLot()
lot.add_spot("A1")
lot.park(0, "CAR-1", "A1")
lot.leave(90, "CAR-1")             # "A1"  (charged 600)
lot.park(90, "CAR-2", "A1")
lot.leave(100, "CAR-2")            # "A1"  (charged 0: grace period)
lot.park(120, "CAR-3", "A1")
lot.occupant_at("A1", 89)          # "CAR-1"
lot.occupant_at("A1", 90)          # "CAR-2"
lot.occupant_at("A1", 110)         # None  (empty between 100 and 120)
lot.occupant_at("A1", 5_000)       # "CAR-3" (still parked)
lot.revenue(0, 90)                 # 0     (CAR-1 left at 90, which is excluded)
lot.revenue(0, 91)                 # 600
```
