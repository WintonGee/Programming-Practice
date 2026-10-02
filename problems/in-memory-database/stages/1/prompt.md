You're building a small in-memory key-value store. Each **record** is identified by a `key` and holds any number of **fields**, each mapped to a string **value**. Implement `InMemoryDB`.

### Operations

| Method | Behavior |
|---|---|
| `set(key, field, value)` | Set `field` of record `key` to `value`, creating the record if it doesn't exist. Overwrites any existing value. Returns `None`. |
| `get(key, field)` | The value of `field` in record `key`, or `None` if the record or the field doesn't exist. |
| `delete(key, field)` | Remove `field` from record `key`. Return `True` if the field existed and was removed, `False` otherwise (unknown record or unknown field). When a record's last field is deleted, the record itself no longer exists. |

Keys, fields, and values are all strings. The empty string `""` is a real value, distinct from "missing". No method raises: missing data is reported with `None` or `False`.

### Example

```python
db = InMemoryDB()
db.set("user1", "name", "Ada")
db.set("user1", "lang", "Python")
db.get("user1", "name")       # "Ada"
db.get("user1", "email")      # None  (no such field)
db.get("user2", "name")       # None  (no such record)
db.set("user1", "name", "Grace")
db.get("user1", "name")       # "Grace"
db.delete("user1", "lang")    # True
db.delete("user1", "lang")    # False (already gone)
```
