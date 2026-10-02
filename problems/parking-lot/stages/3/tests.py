from solution import ParkingLot


def _mixed_lot():
    lot = ParkingLot()
    lot.add_spot("S1", "small")
    lot.add_spot("M2")
    lot.add_spot("M1", "medium")
    lot.add_spot("L1", "large")
    return lot


def test_add_spot_rejects_unknown_size():
    """A spot size outside small/medium/large is rejected and not added."""
    lot = ParkingLot()
    assert lot.add_spot("X1", "huge") is False
    assert lot.add_spot("X1", "large") is True
    assert lot.free_spots() == ["X1"]


def test_vehicles_fit_big_enough_spots():
    """Motorcycles fit anywhere, cars need medium or large, trucks need large."""
    lot = _mixed_lot()
    assert lot.park(0, "CAR-1", "S1", "car") is False
    assert lot.park(0, "TRUCK-1", "M1", "truck") is False
    assert lot.park(0, "BIKE-1", "L1", "motorcycle") is True
    assert lot.park(0, "CAR-1", "M1", "car") is True
    assert lot.find_vehicle("TRUCK-1") is None


def test_park_rejects_unknown_vehicle():
    """An unknown vehicle type cannot park, explicitly or automatically."""
    lot = _mixed_lot()
    assert lot.park(0, "BUS-1", "L1", "bus") is False
    assert lot.park_auto(0, "BUS-1", "bus") is None
    assert lot.find_vehicle("BUS-1") is None


def test_defaults_are_medium_spot_and_car():
    """Without the new arguments, spots are medium and vehicles are cars."""
    lot = ParkingLot()
    lot.add_spot("A1")
    assert lot.park(0, "TRUCK-1", "A1", "truck") is False
    assert lot.park(0, "CAR-1", "A1") is True
    assert lot.quote(60, "CAR-1") == 300


def test_park_auto_smallest_fitting_size():
    """Auto-parking prefers the smallest spot size the vehicle fits."""
    lot = _mixed_lot()
    assert lot.park_auto(0, "BIKE-1", "motorcycle") == "S1"
    assert lot.park_auto(0, "TRUCK-1", "truck") == "L1"
    assert lot.park_auto(0, "CAR-1") == "M1"


def test_park_auto_ties_by_lowest_id():
    """Among free spots of the best size, the lowest id wins."""
    lot = ParkingLot()
    for spot_id in ["B2", "A10", "B1", "A9"]:
        lot.add_spot(spot_id, "medium")
    assert lot.park_auto(0, "CAR-1") == "A10"
    assert lot.park_auto(0, "CAR-2") == "A9"
    assert lot.park_auto(0, "CAR-3") == "B1"


def test_park_auto_moves_up_when_full():
    """When the smallest fitting size is full, a larger spot is used."""
    lot = _mixed_lot()
    assert lot.park_auto(0, "BIKE-1", "motorcycle") == "S1"
    assert lot.park_auto(0, "BIKE-2", "motorcycle") == "M1"
    assert lot.park_auto(0, "CAR-1") == "M2"
    assert lot.park_auto(0, "CAR-2") == "L1"


def test_park_auto_no_fit():
    """With no free spot that fits, auto-parking returns None."""
    lot = _mixed_lot()
    lot.park(0, "CAR-1", "L1")
    assert lot.park_auto(1, "TRUCK-1", "truck") is None
    assert lot.free_spots() == ["M1", "M2", "S1"]
    assert lot.park_auto(1, "CAR-2") == "M1"


def test_park_auto_already_parked():
    """A plate already in the lot can't be auto-parked again."""
    lot = _mixed_lot()
    lot.park_auto(0, "CAR-1")
    assert lot.park_auto(1, "CAR-1") is None
    assert lot.find_vehicle("CAR-1") == "M1"
    assert lot.free_spots() == ["L1", "M2", "S1"]


def test_auto_parked_vehicle_leaves_normally():
    """An auto-parked vehicle leaves and pays like any other."""
    lot = _mixed_lot()
    spot = lot.park_auto(0, "CAR-1")
    assert lot.leave(61, "CAR-1") == spot
    assert lot.total_paid("CAR-1") == 600
    assert lot.park_auto(70, "CAR-2") == "M1"


def test_fee_depends_on_vehicle_type():
    """Rates are 100, 300 and 600 cents per started hour by vehicle type."""
    lot = _mixed_lot()
    lot.park(0, "BIKE-1", "L1", "motorcycle")
    lot.park(0, "CAR-1", "M1")
    assert lot.quote(90, "BIKE-1") == 200
    assert lot.quote(90, "CAR-1") == 600
    lot.leave(90, "BIKE-1")
    lot.park(100, "TRUCK-1", "L1", "truck")
    assert lot.quote(115, "TRUCK-1") == 0
    lot.leave(160, "TRUCK-1")
    assert lot.total_paid("TRUCK-1") == 600
    assert lot.total_paid("BIKE-1") == 200
