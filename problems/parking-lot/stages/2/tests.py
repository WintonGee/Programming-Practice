from solution import ParkingLot


def _parked_at(timestamp, plate="CAR-1"):
    lot = ParkingLot()
    lot.add_spot("A1")
    lot.add_spot("A2")
    lot.park(timestamp, plate, "A1")
    return lot


def test_grace_period_is_free():
    """Stays of 0 to 15 minutes cost nothing."""
    lot = _parked_at(100)
    assert lot.quote(100, "CAR-1") == 0
    assert lot.quote(115, "CAR-1") == 0


def test_first_hour_after_grace():
    """16 through 60 minutes is one started hour."""
    lot = _parked_at(100)
    assert lot.quote(116, "CAR-1") == 300
    assert lot.quote(160, "CAR-1") == 300


def test_started_hours_round_up():
    """Every started hour is charged in full."""
    lot = _parked_at(0)
    assert lot.quote(61, "CAR-1") == 600
    assert lot.quote(120, "CAR-1") == 600
    assert lot.quote(121, "CAR-1") == 900
    assert lot.quote(24 * 60, "CAR-1") == 7_200


def test_quote_does_not_leave():
    """Quoting leaves the vehicle parked and charges nothing."""
    lot = _parked_at(0)
    lot.quote(90, "CAR-1")
    assert lot.find_vehicle("CAR-1") == "A1"
    assert lot.total_paid("CAR-1") == 0


def test_quote_not_parked():
    """Quoting a plate that isn't parked returns None."""
    lot = _parked_at(0)
    assert lot.quote(10, "GHOST") is None
    lot.leave(20, "CAR-1")
    assert lot.quote(30, "CAR-1") is None


def test_leave_charges_fee():
    """Leaving charges the stay and still returns the spot id."""
    lot = _parked_at(0)
    assert lot.leave(130, "CAR-1") == "A1"
    assert lot.total_paid("CAR-1") == 900


def test_total_paid_accumulates():
    """Fees from several stays add up; a free stay adds nothing."""
    lot = _parked_at(0)
    lot.leave(30, "CAR-1")
    lot.park(100, "CAR-1", "A2")
    lot.leave(110, "CAR-1")
    lot.park(200, "CAR-1", "A1")
    lot.leave(320, "CAR-1")
    assert lot.total_paid("CAR-1") == 900


def test_total_paid_unknown_plate():
    """A plate that never left the lot has paid 0."""
    lot = _parked_at(0)
    assert lot.total_paid("GHOST") == 0
    assert lot.total_paid("CAR-1") == 0


def test_totals_are_per_plate():
    """Each plate pays only for its own stays."""
    lot = _parked_at(0, "CAR-1")
    lot.park(10, "CAR-2", "A2")
    lot.leave(70, "CAR-2")
    lot.leave(200, "CAR-1")
    assert lot.total_paid("CAR-1") == 1_200
    assert lot.total_paid("CAR-2") == 300


def test_failed_leave_charges_nothing():
    """Leaving with a plate that isn't parked charges nobody."""
    lot = _parked_at(0)
    assert lot.leave(100, "GHOST") is None
    assert lot.total_paid("GHOST") == 0
    assert lot.total_paid("CAR-1") == 0
