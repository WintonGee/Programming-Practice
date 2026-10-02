from solution import ParkingLot


def _lot(*spot_ids):
    lot = ParkingLot()
    for spot_id in spot_ids:
        lot.add_spot(spot_id)
    return lot


def test_add_spot():
    """New spots return True; a duplicate id returns False."""
    lot = ParkingLot()
    assert lot.add_spot("A1") is True
    assert lot.add_spot("A2") is True
    assert lot.add_spot("A1") is False


def test_park_and_find():
    """A parked vehicle can be found in its spot."""
    lot = _lot("A1", "A2")
    assert lot.park(10, "CAR-1", "A2") is True
    assert lot.find_vehicle("CAR-1") == "A2"


def test_find_unknown_vehicle():
    """A plate that isn't parked has no spot."""
    lot = _lot("A1")
    assert lot.find_vehicle("GHOST") is None


def test_park_unknown_spot():
    """Parking in a spot that was never added fails."""
    lot = _lot("A1")
    assert lot.park(1, "CAR-1", "Z9") is False
    assert lot.find_vehicle("CAR-1") is None


def test_park_occupied_spot():
    """A spot holds one vehicle; the first one stays."""
    lot = _lot("A1")
    lot.park(1, "CAR-1", "A1")
    assert lot.park(2, "CAR-2", "A1") is False
    assert lot.find_vehicle("CAR-1") == "A1"
    assert lot.find_vehicle("CAR-2") is None


def test_same_plate_twice():
    """A vehicle already in the lot can't park a second time."""
    lot = _lot("A1", "A2")
    lot.park(1, "CAR-1", "A1")
    assert lot.park(2, "CAR-1", "A2") is False
    assert lot.find_vehicle("CAR-1") == "A1"
    assert lot.free_spots() == ["A2"]


def test_leave_returns_spot():
    """Leaving frees the spot and returns its id."""
    lot = _lot("A1")
    lot.park(1, "CAR-1", "A1")
    assert lot.leave(5, "CAR-1") == "A1"
    assert lot.find_vehicle("CAR-1") is None
    assert lot.free_spots() == ["A1"]


def test_leave_not_parked():
    """Leaving with a plate that isn't parked returns None, even right after it left."""
    lot = _lot("A1")
    assert lot.leave(1, "GHOST") is None
    lot.park(2, "CAR-1", "A1")
    lot.leave(3, "CAR-1")
    assert lot.leave(4, "CAR-1") is None


def test_free_spots_sorted():
    """Free spots are listed in ascending string order, whatever order they were added in."""
    lot = _lot("B2", "A10", "A2", "B1")
    lot.park(1, "CAR-1", "B1")
    assert lot.free_spots() == ["A10", "A2", "B2"]


def test_free_spots_empty_lot():
    """A lot with no spots, or with every spot taken, has no free spots."""
    assert ParkingLot().free_spots() == []
    lot = _lot("A1")
    lot.park(1, "CAR-1", "A1")
    assert lot.free_spots() == []


def test_repark_after_leaving():
    """A vehicle that left can park again, and its old spot can be reused."""
    lot = _lot("A1", "A2")
    lot.park(1, "CAR-1", "A1")
    lot.leave(2, "CAR-1")
    assert lot.park(3, "CAR-2", "A1") is True
    assert lot.park(4, "CAR-1", "A2") is True
    assert lot.find_vehicle("CAR-1") == "A2"
    assert lot.find_vehicle("CAR-2") == "A1"
