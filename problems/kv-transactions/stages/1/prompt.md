You're building the storage engine for a small database. To start, it is a plain map from string **keys** to string **values**, plus one query that real databases answer constantly: how many keys hold a given value. Implement `KVStore`.

### Operations

| Method | Behavior |
|---|---|
| `set(key, value)` | Store `value` under `key`, creating the key or overwriting its existing value. Returns `None`. |
| `get(key)` | The value stored under `key`, or `None` if the key doesn't exist. |
| `delete(key)` | Remove `key`. Return `True` if it existed and was removed, `False` otherwise. |
| `count(value)` | The number of keys whose current value is exactly `value`. `0` if none. |

### Rules

- Keys and values are strings. The empty string `""` is a real value, distinct from "missing".
- No method raises: missing data is reported with `None`, `False`, or `0`.

### Example

```python
store = KVStore()
store.set("a", "10")
store.set("b", "10")
store.count("10")      # 2
store.set("b", "20")   # overwrite
store.count("10")      # 1
store.count("20")      # 1
store.get("b")         # "20"
store.delete("a")      # True
store.delete("a")      # False (already gone)
store.get("a")         # None
store.count("10")      # 0
```
