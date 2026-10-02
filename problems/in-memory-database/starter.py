class InMemoryDB:
    def __init__(self) -> None:
        raise NotImplementedError

    def set(self, key: str, field: str, value: str) -> None:
        # Set `field` of record `key` to `value`, creating the record if needed
        raise NotImplementedError

    def get(self, key: str, field: str) -> str | None:
        # The field's value, or None if the record or field doesn't exist
        raise NotImplementedError

    def delete(self, key: str, field: str) -> bool:
        # Remove the field; True if it existed, False otherwise
        raise NotImplementedError


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, InMemoryDB!")


if __name__ == "__main__":
    main()
