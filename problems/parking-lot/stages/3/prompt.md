The garage adds motorcycle bays and truck bays. Spots now have a **size**, vehicles have a **type**, and a vehicle only fits in a spot that is big enough. Attendants also want the system to pick a spot for them.

### Sizes and fitting

| Vehicle type | Fits in spot sizes | Rate per started hour |
|---|---|---|
| `"motorcycle"` | `"small"`, `"medium"`, `"large"` | `100` cents |
| `"car"` | `"medium"`, `"large"` | `300` cents |
| `"truck"` | `"large"` | `600` cents |

Sizes are ordered `"small"` < `"medium"` < `"large"`. The fee depends on the **vehicle type**, not on the spot it parked in. The 15-minute grace period still applies to every vehicle.

### Changed operations

| Method | Behavior |
|---|---|
| `add_spot(spot_id, size="medium")` | Gains an optional `size`. Also return `False` (and add nothing) if `size` isn't one of the three sizes. |
| `park(timestamp, plate, spot_id, vehicle="car")` | Gains an optional vehicle type. Also return `False` if `vehicle` isn't one of the three types or doesn't fit in that spot. |

Existing calls without the new arguments keep working: spots default to `"medium"` and vehicles to `"car"`, so Stage 1–2 behavior and prices are unchanged.

### New operation

| Method | Behavior |
|---|---|
| `park_auto(timestamp, plate, vehicle="car")` | Park the vehicle in a free spot chosen by the lot and return its `spot_id`. Choose the **smallest size** that fits; among free spots of that size, the **lowest `spot_id`** (string order). Return `None` and change nothing if the plate is already parked, `vehicle` isn't a valid type, or no free spot fits. |

All Stage 1–2 behavior still applies.

### Example

```python
lot = ParkingLot()
lot.add_spot("S1", "small")
lot.add_spot("M2")                           # medium by default
lot.add_spot("M1", "medium")
lot.add_spot("L1", "large")
lot.add_spot("X1", "huge")                   # False (not a size)
lot.park(0, "TRUCK-1", "M1", "truck")        # False (a truck needs a large spot)
lot.park_auto(0, "BIKE-1", "motorcycle")     # "S1"
lot.park_auto(0, "BIKE-2", "motorcycle")     # "M1" (no small spot left; M1 < M2)
lot.park_auto(0, "CAR-1")                    # "M2"
lot.park_auto(0, "CAR-2")                    # "L1"
lot.park_auto(0, "TRUCK-1", "truck")         # None (L1 is taken)
lot.quote(90, "BIKE-1")                      # 200 (2 started hours at 100)
```
