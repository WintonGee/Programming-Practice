from collections import Counter


class KVStore:
    def __init__(self) -> None:
        self.data: dict[str, str] = {}
        self.counts: Counter[str] = Counter()

    def set(self, key: str, value: str) -> None:
        if key in self.data:
            self.counts[self.data[key]] -= 1
        self.data[key] = value
        self.counts[value] += 1

    def get(self, key: str) -> str | None:
        return self.data.get(key)

    def delete(self, key: str) -> bool:
        if key not in self.data:
            return False
        self.counts[self.data.pop(key)] -= 1
        return True

    def count(self, value: str) -> int:
        return self.counts[value]
