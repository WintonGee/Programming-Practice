from collections import Counter


class KVStore:
    def __init__(self) -> None:
        self.data: dict[str, str] = {}
        self.counts: Counter[str] = Counter()
        # key -> value before the open transaction first touched it (None = absent);
        # None when no transaction is open.
        self.undo: dict[str, str | None] | None = None

    def _apply(self, key: str, value: str | None) -> None:
        """Set `key` to `value` (None deletes it), keeping value counts current."""
        if key in self.data:
            self.counts[self.data.pop(key)] -= 1
        if value is not None:
            self.data[key] = value
            self.counts[value] += 1

    def _write(self, key: str, value: str | None) -> None:
        """A client write: remember the old value for rollback, then apply."""
        if self.undo is not None:
            self.undo.setdefault(key, self.data.get(key))
        self._apply(key, value)

    def set(self, key: str, value: str) -> None:
        self._write(key, value)

    def get(self, key: str) -> str | None:
        return self.data.get(key)

    def delete(self, key: str) -> bool:
        if key not in self.data:
            return False
        self._write(key, None)
        return True

    def count(self, value: str) -> int:
        return self.counts[value]

    def begin(self) -> None:
        self.undo = {}

    def commit(self) -> bool:
        if self.undo is None:
            return False
        self.undo = None
        return True

    def rollback(self) -> bool:
        if self.undo is None:
            return False
        for key, old in self.undo.items():
            self._apply(key, old)
        self.undo = None
        return True
