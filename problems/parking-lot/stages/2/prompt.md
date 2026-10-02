The garage starts charging. When a vehicle leaves, it pays for its **stay**: the minutes from the `park` timestamp to the `leave` timestamp. All money is **integer cents**.

### Fee rules

- A stay of **15 minutes or less** is free (grace period).
- Otherwise the fee is **300 cents per started hour**: `16`–`60` minutes cost `300`, `61`–`120` minutes cost `600`, and so on.

### New operations

| Method | Behavior |
|---|---|
| `quote(timestamp, plate)` | The fee the vehicle would pay if it left at `timestamp`, without making it leave. `None` if the plate isn't currently parked. |
| `total_paid(plate)` | Total cents this plate has paid across all of its completed stays. `0` for a plate that has never left the lot. |

### Changed behavior

- `leave` now charges the vehicle for the stay that just ended. It still returns the `spot_id`.

All Stage 1 behavior still applies.

### Example

```python
lot = ParkingLot()
lot.add_spot("A1")
lot.park(0, "CAR-1", "A1")
lot.quote(15, "CAR-1")        # 0     (grace period)
lot.quote(16, "CAR-1")        # 300
lot.quote(60, "CAR-1")        # 300
lot.quote(61, "CAR-1")        # 600
lot.leave(130, "CAR-1")       # "A1"  (130 minutes: 3 started hours)
lot.total_paid("CAR-1")       # 900
lot.park(200, "CAR-1", "A1")
lot.leave(210, "CAR-1")       # "A1"  (10 minutes: free)
lot.total_paid("CAR-1")       # 900
```
