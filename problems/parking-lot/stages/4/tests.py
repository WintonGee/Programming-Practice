from solution import ParkingLot


def _one_spot_day():
    lot = ParkingLot()
    lot.add_spot("A1")
    lot.park(0, "CAR-1", "A1")
    lot.leave(90, "CAR-1")
    lot.park(90, "CAR-2", "A1")
    lot.leave(100, "CAR-2")
    lot.park(120, "CAR-3", "A1")
    return lot


def test_occupant_at_during_stay():
    """A vehicle occupies its spot from its park minute until it leaves."""
    lot = _one_spot_day()
    assert lot.occupant_at("A1", 0) == "CAR-1"
    assert lot.occupant_at("A1", 89) == "CAR-1"
    assert lot.occupant_at("A1", 95) == "CAR-2"


def test_occupant_at_handover_minute():
    """At the minute one vehicle leaves and another parks, the new one is the occupant."""
    lot = _one_spot_day()
    assert lot.occupant_at("A1", 90) == "CAR-2"


def test_occupant_at_empty_times():
    """Before the first stay and between stays, the spot is empty."""
    lot = _one_spot_day()
    assert lot.occupant_at("A1", -5) is None
    assert lot.occupant_at("A1", 100) is None
    assert lot.occupant_at("A1", 119) is None


def test_occupant_at_still_parked():
    """A vehicle that hasn't left occupies its spot at any later time."""
    lot = _one_spot_day()
    assert lot.occupant_at("A1", 120) == "CAR-3"
    assert lot.occupant_at("A1", 100_000) == "CAR-3"


def test_occupant_at_unknown_spot():
    """An unknown spot has no occupant."""
    lot = _one_spot_day()
    assert lot.occupant_at("Z9", 50) is None


def test_occupant_at_zero_length_stay():
    """A vehicle that parks and leaves in the same minute never occupies the spot."""
    lot = ParkingLot()
    lot.add_spot("A1")
    lot.park(10, "CAR-1", "A1")
    lot.leave(10, "CAR-1")
    assert lot.occupant_at("A1", 10) is None
    assert lot.total_paid("CAR-1") == 0


def test_occupant_history_per_spot():
    """Each spot keeps its own history, including auto-parked and re-parked vehicles."""
    lot = ParkingLot()
    lot.add_spot("M1")
    lot.add_spot("L1", "large")
    lot.park_auto(0, "CAR-1")
    lot.leave(30, "CAR-1")
    lot.park(40, "CAR-1", "L1")
    lot.park_auto(50, "TRUCK-1", "truck")
    assert lot.occupant_at("M1", 20) == "CAR-1"
    assert lot.occupant_at("M1", 45) is None
    assert lot.occupant_at("L1", 45) == "CAR-1"
    assert lot.occupant_at("L1", 20) is None


def test_revenue_half_open_window():
    """Revenue includes payments at `start` and excludes payments at `end`."""
    lot = _one_spot_day()
    assert lot.revenue(0, 90) == 0
    assert lot.revenue(90, 91) == 600
    assert lot.revenue(0, 1_000) == 600


def test_revenue_sums_vehicle_types():
    """Revenue adds up every leave in the window at each vehicle's own rate."""
    lot = ParkingLot()
    lot.add_spot("S1", "small")
    lot.add_spot("M1")
    lot.add_spot("L1", "large")
    lot.park(0, "BIKE-1", "S1", "motorcycle")
    lot.park(0, "CAR-1", "M1")
    lot.park(0, "TRUCK-1", "L1", "truck")
    lot.leave(60, "BIKE-1")
    lot.leave(120, "CAR-1")
    lot.leave(180, "TRUCK-1")
    assert lot.revenue(0, 181) == 100 + 600 + 1_800
    assert lot.revenue(60, 180) == 700
    assert lot.revenue(121, 180) == 0


def test_revenue_counts_repeat_stays_separately():
    """Two stays by the same plate are two payments at their own times."""
    lot = ParkingLot()
    lot.add_spot("A1")
    lot.park(0, "CAR-1", "A1")
    lot.leave(60, "CAR-1")
    lot.park(100, "CAR-1", "A1")
    lot.leave(200, "CAR-1")
    assert lot.revenue(0, 100) == 300
    assert lot.revenue(100, 201) == 600
    assert lot.total_paid("CAR-1") == 900


def test_revenue_ignores_parked_vehicles():
    """Vehicles still in the lot haven't paid, so they add no revenue."""
    lot = _one_spot_day()
    assert lot.quote(1_000, "CAR-3") == 4_500
    assert lot.revenue(0, 10_000) == 600
