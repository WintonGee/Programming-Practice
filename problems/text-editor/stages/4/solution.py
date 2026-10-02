from dataclasses import dataclass, field


@dataclass(frozen=True)
class Snapshot:
    text: str
    cursor: int
    selection: tuple[int, int] | None


@dataclass
class Document:
    text: str = ""
    cursor: int = 0
    selection: tuple[int, int] | None = None
    undo_stack: list[Snapshot] = field(default_factory=list)
    redo_stack: list[Snapshot] = field(default_factory=list)

    def clamp(self, position: int) -> int:
        return max(0, min(position, len(self.text)))

    def snapshot(self) -> Snapshot:
        return Snapshot(self.text, self.cursor, self.selection)

    def restore(self, snapshot: Snapshot) -> None:
        self.text = snapshot.text
        self.cursor = snapshot.cursor
        self.selection = snapshot.selection

    def edit(self, start: int, end: int, text: str) -> None:
        before = self.snapshot()
        self.text = self.text[:start] + text + self.text[end:]
        self.cursor = start + len(text)
        self.selection = None
        if self.text != before.text:
            self.undo_stack.append(before)
            self.redo_stack.clear()

    def target(self) -> tuple[int, int]:
        return self.selection or (self.cursor, self.cursor)

    def undo(self) -> bool:
        if not self.undo_stack:
            return False
        self.redo_stack.append(self.snapshot())
        self.restore(self.undo_stack.pop())
        return True

    def redo(self) -> bool:
        if not self.redo_stack:
            return False
        self.undo_stack.append(self.snapshot())
        self.restore(self.redo_stack.pop())
        return True


class TextEditor:
    def __init__(self) -> None:
        self.documents: dict[str, Document] = {"main": Document()}
        self.active = "main"
        self.clipboard: str | None = None

    @property
    def doc(self) -> Document:
        return self.documents[self.active]

    def create(self, name: str) -> bool:
        if name in self.documents:
            return False
        self.documents[name] = Document()
        return True

    def switch(self, name: str) -> bool:
        if name not in self.documents:
            return False
        self.active = name
        return True

    def current_document(self) -> str:
        return self.active

    def append(self, text: str) -> None:
        end = len(self.doc.text)
        self.doc.edit(end, end, text)

    def insert(self, text: str) -> None:
        self.doc.edit(*self.doc.target(), text)

    def move_cursor(self, position: int) -> int:
        doc = self.doc
        doc.cursor = doc.clamp(position)
        doc.selection = None
        return doc.cursor

    def backspace(self, n: int = 1) -> int:
        if n < 0:
            raise ValueError("n must be non-negative")
        doc = self.doc
        start, end = doc.selection or (max(0, doc.cursor - n), doc.cursor)
        doc.edit(start, end, "")
        return end - start

    def select(self, start: int, end: int) -> None:
        doc = self.doc
        start, end = sorted((doc.clamp(start), doc.clamp(end)))
        doc.selection = (start, end) if start < end else None
        doc.cursor = end

    def get_selection(self) -> tuple[int, int] | None:
        return self.doc.selection

    def copy(self) -> str:
        if self.doc.selection is None:
            return ""
        start, end = self.doc.selection
        self.clipboard = self.doc.text[start:end]
        return self.clipboard

    def paste(self) -> bool:
        if self.clipboard is None:
            return False
        self.insert(self.clipboard)
        return True

    def undo(self) -> bool:
        return self.doc.undo()

    def redo(self) -> bool:
        return self.doc.redo()

    def get_text(self) -> str:
        return self.doc.text

    def get_cursor(self) -> int:
        return self.doc.cursor
