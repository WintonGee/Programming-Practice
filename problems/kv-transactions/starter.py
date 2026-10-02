class KVStore:
    def __init__(self) -> None:
        raise NotImplementedError

    def set(self, key: str, value: str) -> None:
        # Store `value` under `key`, overwriting any existing value
        raise NotImplementedError

    def get(self, key: str) -> str | None:
        # The value stored under `key`, or None if the key doesn't exist
        raise NotImplementedError

    def delete(self, key: str) -> bool:
        # Remove `key`; True if it existed, False otherwise
        raise NotImplementedError

    def count(self, value: str) -> int:
        # How many keys currently hold exactly `value`
        raise NotImplementedError


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, KVStore!")


if __name__ == "__main__":
    main()
