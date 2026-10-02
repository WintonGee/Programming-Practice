class CloudStorage:
    def __init__(self) -> None:
        self.files: dict[str, int] = {}

    def add_file(self, name: str, size: int) -> bool:
        if name in self.files:
            return False
        self.files[name] = size
        return True

    def get_file_size(self, name: str) -> int | None:
        return self.files.get(name)

    def delete_file(self, name: str) -> int | None:
        return self.files.pop(name, None)
