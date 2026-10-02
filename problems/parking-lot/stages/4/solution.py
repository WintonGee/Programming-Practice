from dataclasses import dataclass, field

GRACE_MINUTES = 15
SIZE_RANK = {"small": 0, "medium": 1, "large": 2}
# The smallest spot size each vehicle type fits in, as a SIZE_RANK value.
MIN_RANK = {"motorcycle": 0, "car": 1, "truck": 2}
HOURLY_RATE_CENTS = {"motorcycle": 100, "car": 300, "truck": 600}


def fee(vehicle: str, minutes: int) -> int:
    if minutes <= GRACE_MINUTES:
        return 0
    started_hours = (minutes + 59) // 60
    return HOURLY_RATE_CENTS[vehicle] * started_hours


@dataclass
class Stay:
    plate: str
    spot_id: str
    vehicle: str
    parked_at: int
    left_at: int | None = None

    def covers(self, at: int) -> bool:
        return self.parked_at <= at and (self.left_at is None or at < self.left_at)


@dataclass
class Spot:
    size: str
    # Every stay in this spot, oldest first; only the last can still be open.
    history: list[Stay] = field(default_factory=list)

    def is_free(self) -> bool:
        return not self.history or self.history[-1].left_at is not None


@dataclass
class Payment:
    timestamp: int
    cents: int


class ParkingLot:
    def __init__(self) -> None:
        self.spots: dict[str, Spot] = {}
        # plate -> current stay, for vehicles currently in the lot
        self.parked: dict[str, Stay] = {}
        self.paid: dict[str, int] = {}
        self.payments: list[Payment] = []

    def add_spot(self, spot_id: str, size: str = "medium") -> bool:
        if spot_id in self.spots or size not in SIZE_RANK:
            return False
        self.spots[spot_id] = Spot(size=size)
        return True

    def _fits(self, spot: Spot, vehicle: str) -> bool:
        return spot.is_free() and SIZE_RANK[spot.size] >= MIN_RANK[vehicle]

    def park(self, timestamp: int, plate: str, spot_id: str, vehicle: str = "car") -> bool:
        if vehicle not in MIN_RANK or spot_id not in self.spots or plate in self.parked:
            return False
        spot = self.spots[spot_id]
        if not self._fits(spot, vehicle):
            return False
        stay = Stay(plate=plate, spot_id=spot_id, vehicle=vehicle, parked_at=timestamp)
        spot.history.append(stay)
        self.parked[plate] = stay
        return True

    def park_auto(self, timestamp: int, plate: str, vehicle: str = "car") -> str | None:
        if vehicle not in MIN_RANK or plate in self.parked:
            return None
        candidates = [
            (SIZE_RANK[spot.size], spot_id)
            for spot_id, spot in self.spots.items()
            if self._fits(spot, vehicle)
        ]
        if not candidates:
            return None
        _, spot_id = min(candidates)
        self.park(timestamp, plate, spot_id, vehicle)
        return spot_id

    def leave(self, timestamp: int, plate: str) -> str | None:
        stay = self.parked.pop(plate, None)
        if stay is None:
            return None
        stay.left_at = timestamp
        cents = fee(stay.vehicle, timestamp - stay.parked_at)
        self.paid[plate] = self.paid.get(plate, 0) + cents
        self.payments.append(Payment(timestamp=timestamp, cents=cents))
        return stay.spot_id

    def quote(self, timestamp: int, plate: str) -> int | None:
        stay = self.parked.get(plate)
        if stay is None:
            return None
        return fee(stay.vehicle, timestamp - stay.parked_at)

    def total_paid(self, plate: str) -> int:
        return self.paid.get(plate, 0)

    def revenue(self, start: int, end: int) -> int:
        return sum(p.cents for p in self.payments if start <= p.timestamp < end)

    def occupant_at(self, spot_id: str, at: int) -> str | None:
        spot = self.spots.get(spot_id)
        if spot is None:
            return None
        for stay in spot.history:
            if stay.covers(at):
                return stay.plate
        return None

    def find_vehicle(self, plate: str) -> str | None:
        stay = self.parked.get(plate)
        return stay.spot_id if stay is not None else None

    def free_spots(self) -> list[str]:
        return sorted(spot_id for spot_id, spot in self.spots.items() if spot.is_free())
