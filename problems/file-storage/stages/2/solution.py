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

    def get_n_largest(self, prefix: str, n: int) -> list[str]:
        matches = [(name, size) for name, size in self.files.items() if name.startswith(prefix)]
        ranked = sorted(matches, key=lambda item: (-item[1], item[0]))
        return [f"{name}({size})" for name, size in ranked[:n]]
