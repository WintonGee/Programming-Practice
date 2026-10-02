from collections import Counter


class KVStore:
    def __init__(self) -> None:
        self.data: dict[str, str] = {}
        self.counts: Counter[str] = Counter()
        # One undo log per open transaction, innermost last. Each maps
        # key -> value before that transaction first touched it (None = absent).
        self.undo_stack: list[dict[str, str | None]] = []

    def _apply(self, key: str, value: str | None) -> None:
        """Set `key` to `value` (None deletes it), keeping value counts current."""
        if key in self.data:
            self.counts[self.data.pop(key)] -= 1
        if value is not None:
            self.data[key] = value
            self.counts[value] += 1

    def _write(self, key: str, value: str | None) -> None:
        """A client write: remember the old value for rollback, then apply."""
        if self.undo_stack:
            self.undo_stack[-1].setdefault(key, self.data.get(key))
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
        self.undo_stack.append({})

    def commit(self) -> bool:
        if not self.undo_stack:
            return False
        undo = self.undo_stack.pop()
        if self.undo_stack:
            parent = self.undo_stack[-1]
            for key, old in undo.items():
                parent.setdefault(key, old)
        return True

    def rollback(self) -> bool:
        if not self.undo_stack:
            return False
        undo = self.undo_stack.pop()
        for key, old in undo.items():
            self._apply(key, old)
        return True

    def depth(self) -> int:
        return len(self.undo_stack)
