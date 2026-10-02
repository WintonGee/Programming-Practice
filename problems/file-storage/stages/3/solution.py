from dataclasses import dataclass

ADMIN = "admin"


@dataclass
class File:
    size: int
    owner: str


@dataclass
class User:
    capacity: int | None  # None means unlimited
    used: int = 0

    def remaining(self) -> int | None:
        return None if self.capacity is None else self.capacity - self.used


class CloudStorage:
    def __init__(self) -> None:
        self.files: dict[str, File] = {}
        self.users: dict[str, User] = {ADMIN: User(capacity=None)}

    def _user(self, user_id: str) -> User | None:
        # The admin is internal; the user-facing API treats it as unknown.
        return None if user_id == ADMIN else self.users.get(user_id)

    def _store(self, user_id: str, name: str, size: int) -> bool:
        user = self.users[user_id]
        if name in self.files:
            return False
        if user.capacity is not None and user.used + size > user.capacity:
            return False
        self.files[name] = File(size, user_id)
        user.used += size
        return True

    def add_file(self, name: str, size: int) -> bool:
        return self._store(ADMIN, name, size)

    def get_file_size(self, name: str) -> int | None:
        file = self.files.get(name)
        return file.size if file is not None else None

    def delete_file(self, name: str) -> int | None:
        file = self.files.pop(name, None)
        if file is None:
            return None
        self.users[file.owner].used -= file.size
        return file.size

    def get_n_largest(self, prefix: str, n: int) -> list[str]:
        matches = [(name, file.size) for name, file in self.files.items() if name.startswith(prefix)]
        ranked = sorted(matches, key=lambda item: (-item[1], item[0]))
        return [f"{name}({size})" for name, size in ranked[:n]]

    def add_user(self, user_id: str, capacity: int) -> bool:
        if user_id in self.users:
            return False
        self.users[user_id] = User(capacity)
        return True

    def add_file_by(self, user_id: str, name: str, size: int) -> int | None:
        user = self._user(user_id)
        if user is None or not self._store(user_id, name, size):
            return None
        return user.remaining()

    def merge_user(self, user_id_1: str, user_id_2: str) -> int | None:
        target = self._user(user_id_1)
        source = self._user(user_id_2)
        if user_id_1 == user_id_2 or target is None or source is None:
            return None
        target.capacity += source.capacity
        target.used += source.used
        for file in self.files.values():
            if file.owner == user_id_2:
                file.owner = user_id_1
        del self.users[user_id_2]
        return target.remaining()
