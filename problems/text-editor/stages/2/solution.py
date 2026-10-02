class TextEditor:
    def __init__(self) -> None:
        self.text = ""
        self.cursor = 0
        self.selection: tuple[int, int] | None = None
        self.clipboard: str | None = None

    def _clamp(self, position: int) -> int:
        return max(0, min(position, len(self.text)))

    def _splice(self, start: int, end: int, text: str) -> None:
        self.text = self.text[:start] + text + self.text[end:]
        self.cursor = start + len(text)
        self.selection = None

    def append(self, text: str) -> None:
        self._splice(len(self.text), len(self.text), text)

    def insert(self, text: str) -> None:
        start, end = self.selection or (self.cursor, self.cursor)
        self._splice(start, end, text)

    def move_cursor(self, position: int) -> int:
        self.cursor = self._clamp(position)
        self.selection = None
        return self.cursor

    def backspace(self, n: int = 1) -> int:
        if n < 0:
            raise ValueError("n must be non-negative")
        start, end = self.selection or (max(0, self.cursor - n), self.cursor)
        self._splice(start, end, "")
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

    def get_text(self) -> str:
        return self.text

    def get_cursor(self) -> int:
        return self.cursor
