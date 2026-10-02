class CloudStorage:
    def __init__(self) -> None:
        raise NotImplementedError

    def add_file(self, name: str, size: int) -> bool:
        # Store a new file; False if a file with this name already exists
        raise NotImplementedError

    def get_file_size(self, name: str) -> int | None:
        # The file's size, or None if it doesn't exist
        raise NotImplementedError

    def delete_file(self, name: str) -> int | None:
        # Remove the file and return its size, or None if it doesn't exist
        raise NotImplementedError


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, CloudStorage!")


if __name__ == "__main__":
    main()
