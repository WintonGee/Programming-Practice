class ParkingLot:
    def __init__(self) -> None:
        raise NotImplementedError

    def add_spot(self, spot_id: str) -> bool:
        # Register a new, empty spot. False if the id already exists
        raise NotImplementedError

    def park(self, timestamp: int, plate: str, spot_id: str) -> bool:
        # Put a vehicle in a specific spot. False if the request is invalid
        raise NotImplementedError

    def leave(self, timestamp: int, plate: str) -> str | None:
        # Vehicle drives out; return the spot it freed, or None if it isn't parked
        raise NotImplementedError

    def find_vehicle(self, plate: str) -> str | None:
        # Which spot is this vehicle in right now?
        raise NotImplementedError

    def free_spots(self) -> list[str]:
        # Ids of every empty spot, sorted ascending
        raise NotImplementedError


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, ParkingLot!")


if __name__ == "__main__":
    main()
