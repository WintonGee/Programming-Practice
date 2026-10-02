class TextEditor:
    def __init__(self) -> None:
        raise NotImplementedError

    def append(self, text: str) -> None:
        # Add text to the end of the document; cursor moves to the end
        raise NotImplementedError

    def insert(self, text: str) -> None:
        # Type text at the cursor; cursor ends up just after it
        raise NotImplementedError

    def move_cursor(self, position: int) -> int:
        # Move the cursor (clamped to [0, len(text)]) and return where it landed
        raise NotImplementedError

    def backspace(self, n: int = 1) -> int:
        # Delete up to n characters before the cursor; return how many were deleted
        raise NotImplementedError

    def get_text(self) -> str:
        # The whole document
        raise NotImplementedError

    def get_cursor(self) -> int:
        # The cursor position
        raise NotImplementedError


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, TextEditor!")


if __name__ == "__main__":
    main()
