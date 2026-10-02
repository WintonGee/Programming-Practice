from dataclasses import dataclass

GRACE_MINUTES = 15
HOURLY_RATE_CENTS = 300


def fee(minutes: int) -> int:
    if minutes <= GRACE_MINUTES:
        return 0
    started_hours = (minutes + 59) // 60
    return HOURLY_RATE_CENTS * started_hours


@dataclass
class Stay:
    spot_id: str
    parked_at: int


class ParkingLot:
    def __init__(self) -> None:
        # spot id -> plate parked there, or None when empty
        self.spots: dict[str, str | None] = {}
        # plate -> current stay, for vehicles currently in the lot
        self.parked: dict[str, Stay] = {}
        self.paid: dict[str, int] = {}

    def add_spot(self, spot_id: str) -> bool:
        if spot_id in self.spots:
            return False
        self.spots[spot_id] = None
        return True

    def park(self, timestamp: int, plate: str, spot_id: str) -> bool:
        if spot_id not in self.spots or self.spots[spot_id] is not None or plate in self.parked:
            return False
        self.spots[spot_id] = plate
        self.parked[plate] = Stay(spot_id=spot_id, parked_at=timestamp)
        return True

    def leave(self, timestamp: int, plate: str) -> str | None:
        stay = self.parked.pop(plate, None)
        if stay is None:
            return None
        self.spots[stay.spot_id] = None
        self.paid[plate] = self.paid.get(plate, 0) + fee(timestamp - stay.parked_at)
        return stay.spot_id

    def quote(self, timestamp: int, plate: str) -> int | None:
        stay = self.parked.get(plate)
        if stay is None:
            return None
        return fee(timestamp - stay.parked_at)

    def total_paid(self, plate: str) -> int:
        return self.paid.get(plate, 0)

    def find_vehicle(self, plate: str) -> str | None:
        stay = self.parked.get(plate)
        return stay.spot_id if stay is not None else None

    def free_spots(self) -> list[str]:
        return sorted(spot_id for spot_id, plate in self.spots.items() if plate is None)
