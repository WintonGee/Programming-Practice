from dataclasses import dataclass


@dataclass
class Entry:
    value: str
    expires_at: int | None = None

    def alive(self, timestamp: int) -> bool:
        return self.expires_at is None or timestamp < self.expires_at


# key -> field -> (value, remaining ttl or None)
Snapshot = dict[str, dict[str, tuple[str, int | None]]]


class InMemoryDB:
    def __init__(self) -> None:
        self.records: dict[str, dict[str, Entry]] = {}
        self.backups: list[tuple[int, Snapshot]] = []

    # Untimed API (Stages 1-2): every stored field is visible.

    def set(self, key: str, field: str, value: str) -> None:
        self.records.setdefault(key, {})[field] = Entry(value)

    def get(self, key: str, field: str) -> str | None:
        entry = self.records.get(key, {}).get(field)
        return entry.value if entry is not None else None

    def delete(self, key: str, field: str) -> bool:
        record = self.records.get(key)
        if record is None or field not in record:
            return False
        del record[field]
        if not record:
            del self.records[key]
        return True

    def scan(self, key: str) -> list[str]:
        return self.scan_by_prefix(key, "")

    def scan_by_prefix(self, key: str, prefix: str) -> list[str]:
        record = self.records.get(key, {})
        return _format(record, prefix)

    # Timed API (Stages 3-4): expired fields are invisible.

    def _live(self, key: str, timestamp: int) -> dict[str, Entry]:
        record = self.records.get(key, {})
        return {field: entry for field, entry in record.items() if entry.alive(timestamp)}

    def set_at(self, key: str, field: str, value: str, timestamp: int) -> None:
        self.records.setdefault(key, {})[field] = Entry(value)

    def set_at_with_ttl(self, key: str, field: str, value: str, timestamp: int, ttl: int) -> None:
        self.records.setdefault(key, {})[field] = Entry(value, timestamp + ttl)

    def get_at(self, key: str, field: str, timestamp: int) -> str | None:
        entry = self._live(key, timestamp).get(field)
        return entry.value if entry is not None else None

    def delete_at(self, key: str, field: str, timestamp: int) -> bool:
        if field not in self._live(key, timestamp):
            return False
        return self.delete(key, field)

    def scan_at(self, key: str, timestamp: int) -> list[str]:
        return self.scan_by_prefix_at(key, "", timestamp)

    def scan_by_prefix_at(self, key: str, prefix: str, timestamp: int) -> list[str]:
        return _format(self._live(key, timestamp), prefix)

    def backup(self, timestamp: int) -> int:
        snapshot: Snapshot = {}
        for key in self.records:
            live = self._live(key, timestamp)
            if live:
                snapshot[key] = {
                    field: (entry.value, None if entry.expires_at is None else entry.expires_at - timestamp)
                    for field, entry in live.items()
                }
        self.backups.append((timestamp, snapshot))
        return len(snapshot)

    def restore(self, timestamp: int, timestamp_to_restore: int) -> bool:
        for backed_up_at, snapshot in reversed(self.backups):
            if backed_up_at <= timestamp_to_restore:
                self.records = {
                    key: {
                        field: Entry(value, None if remaining is None else timestamp + remaining)
                        for field, (value, remaining) in fields.items()
                    }
                    for key, fields in snapshot.items()
                }
                return True
        return False


def _format(record: dict[str, Entry], prefix: str) -> list[str]:
    return [
        f"{field}({entry.value})"
        for field, entry in sorted(record.items())
        if field.startswith(prefix)
    ]
