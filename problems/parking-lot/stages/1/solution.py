class ParkingLot:
    def __init__(self) -> None:
        # spot id -> plate parked there, or None when empty
        self.spots: dict[str, str | None] = {}
        # plate -> spot id, for vehicles currently in the lot
        self.parked: dict[str, str] = {}

    def add_spot(self, spot_id: str) -> bool:
        if spot_id in self.spots:
            return False
        self.spots[spot_id] = None
        return True

    def park(self, timestamp: int, plate: str, spot_id: str) -> bool:
        if spot_id not in self.spots or self.spots[spot_id] is not None or plate in self.parked:
            return False
        self.spots[spot_id] = plate
        self.parked[plate] = spot_id
        return True

    def leave(self, timestamp: int, plate: str) -> str | None:
        spot_id = self.parked.pop(plate, None)
        if spot_id is None:
            return None
        self.spots[spot_id] = None
        return spot_id

    def find_vehicle(self, plate: str) -> str | None:
        return self.parked.get(plate)

    def free_spots(self) -> list[str]:
        return sorted(spot_id for spot_id, plate in self.spots.items() if plate is None)
