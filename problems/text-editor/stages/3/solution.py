from dataclasses import dataclass


@dataclass(frozen=True)
class Snapshot:
    text: str
    cursor: int
    selection: tuple[int, int] | None


class TextEditor:
    def __init__(self) -> None:
        self.text = ""
        self.cursor = 0
        self.selection: tuple[int, int] | None = None
        self.clipboard: str | None = None
        self.undo_stack: list[Snapshot] = []
        self.redo_stack: list[Snapshot] = []

    def _clamp(self, position: int) -> int:
        return max(0, min(position, len(self.text)))

    def _snapshot(self) -> Snapshot:
        return Snapshot(self.text, self.cursor, self.selection)

    def _restore(self, snapshot: Snapshot) -> None:
        self.text = snapshot.text
        self.cursor = snapshot.cursor
        self.selection = snapshot.selection

    def _edit(self, start: int, end: int, text: str) -> None:
        before = self._snapshot()
        self.text = self.text[:start] + text + self.text[end:]
        self.cursor = start + len(text)
        self.selection = None
        if self.text != before.text:
            self.undo_stack.append(before)
            self.redo_stack.clear()

    def append(self, text: str) -> None:
        self._edit(len(self.text), len(self.text), text)

    def insert(self, text: str) -> None:
        start, end = self.selection or (self.cursor, self.cursor)
        self._edit(start, end, text)

    def move_cursor(self, position: int) -> int:
        self.cursor = self._clamp(position)
        self.selection = None
        return self.cursor

    def backspace(self, n: int = 1) -> int:
        if n < 0:
            raise ValueError("n must be non-negative")
        start, end = self.selection or (max(0, self.cursor - n), self.cursor)
        self._edit(start, end, "")
        return end - start

    def select(self, start: int, end: int) -> None:
        start, end = sorted((self._clamp(start), self._clamp(end)))
        self.selection = (start, end) if start < end else None
        self.cursor = end

    def get_selection(self) -> tuple[int, int] | None:
        return self.selection

    def copy(self) -> str:
        if self.selection is None:
            return ""
        start, end = self.selection
        self.clipboard = self.text[start:end]
        return self.clipboard

    def paste(self) -> bool:
        if self.clipboard is None:
            return False
        self.insert(self.clipboard)
        return True

    def undo(self) -> bool:
        if not self.undo_stack:
            return False
        self.redo_stack.append(self._snapshot())
        self._restore(self.undo_stack.pop())
        return True

    def redo(self) -> bool:
        if not self.redo_stack:
            return False
        self.undo_stack.append(self._snapshot())
        self._restore(self.redo_stack.pop())
        return True

    def get_text(self) -> str:
        return self.text

    def get_cursor(self) -> int:
        return self.cursor
