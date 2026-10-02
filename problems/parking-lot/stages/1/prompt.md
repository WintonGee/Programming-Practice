You're writing the software for a staffed parking garage. Attendants register the garage's **spots**, park vehicles in a specific spot, and look up where a vehicle is. Implement `ParkingLot`.

Vehicles are identified by their license `plate` (a string); spots by a `spot_id` (a string such as `"A1"`). `park` and `leave` take a `timestamp` (integer minutes) as their first argument; timestamps **never decrease** from one call to the next. You won't need them yet, but later stages will.

### Operations

| Method | Behavior |
|---|---|
| `add_spot(spot_id)` | Register a new, empty spot. Return `True`, or `False` if a spot with that id already exists. |
| `park(timestamp, plate, spot_id)` | Park the vehicle in that spot and return `True`. Return `False` and change nothing if the spot doesn't exist, the spot is occupied, or this plate is already parked somewhere in the lot. |
| `leave(timestamp, plate)` | The vehicle drives out, freeing its spot. Return the `spot_id` it was in, or `None` if the plate isn't currently parked. |
| `find_vehicle(plate)` | The `spot_id` the vehicle is parked in, or `None` if it isn't currently parked. |
| `free_spots()` | A list of the ids of every empty spot, sorted ascending (plain string order). |

No method raises: invalid requests return `False` or `None`. A vehicle that has left may park again later, in any spot.

### Example

```python
lot = ParkingLot()
lot.add_spot("A1")                 # True
lot.add_spot("A2")                 # True
lot.add_spot("A1")                 # False (already exists)
lot.park(10, "CAR-1", "A2")        # True
lot.park(11, "CAR-2", "A2")        # False (occupied)
lot.park(12, "CAR-1", "A1")        # False (CAR-1 is already parked)
lot.find_vehicle("CAR-1")          # "A2"
lot.free_spots()                   # ["A1"]
lot.leave(40, "CAR-1")             # "A2"
lot.leave(41, "CAR-1")             # None (not parked any more)
lot.free_spots()                   # ["A1", "A2"]
```
