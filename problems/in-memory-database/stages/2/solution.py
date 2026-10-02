class InMemoryDB:
    def __init__(self) -> None:
        self.records: dict[str, dict[str, str]] = {}

    def set(self, key: str, field: str, value: str) -> None:
        self.records.setdefault(key, {})[field] = value

    def get(self, key: str, field: str) -> str | None:
        return self.records.get(key, {}).get(field)

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
        return [f"{field}({value})" for field, value in sorted(record.items()) if field.startswith(prefix)]
