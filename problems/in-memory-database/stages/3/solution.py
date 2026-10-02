from dataclasses import dataclass


@dataclass
class Entry:
    value: str
    expires_at: int | None = None

    def alive(self, timestamp: int) -> bool:
        return self.expires_at is None or timestamp < self.expires_at


class InMemoryDB:
    def __init__(self) -> None:
        self.records: dict[str, dict[str, Entry]] = {}

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

    # Timed API (Stage 3): expired fields are invisible.

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


def _format(record: dict[str, Entry], prefix: str) -> list[str]:
    return [
        f"{field}({entry.value})"
        for field, entry in sorted(record.items())
        if field.startswith(prefix)
    ]
