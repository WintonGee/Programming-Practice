class TextEditor:
    def __init__(self) -> None:
        self.text = ""
        self.cursor = 0

    def _splice(self, start: int, end: int, text: str) -> None:
        self.text = self.text[:start] + text + self.text[end:]
        self.cursor = start + len(text)

    def append(self, text: str) -> None:
        self._splice(len(self.text), len(self.text), text)

    def insert(self, text: str) -> None:
        self._splice(self.cursor, self.cursor, text)

    def move_cursor(self, position: int) -> int:
        self.cursor = max(0, min(position, len(self.text)))
        return self.cursor

    def backspace(self, n: int = 1) -> int:
        if n < 0:
            raise ValueError("n must be non-negative")
        start = max(0, self.cursor - n)
        deleted = self.cursor - start
        self._splice(start, self.cursor, "")
        return deleted

    def get_text(self) -> str:
        return self.text

    def get_cursor(self) -> int:
        return self.cursor
