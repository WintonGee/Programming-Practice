You're building the storage layer of a cloud drive. Files are identified by their full **name** (a path like `"docs/report.pdf"`) and have a **size** in bytes. Implement `CloudStorage`.

### Operations

| Method | Behavior |
|---|---|
| `add_file(name, size)` | Store a new file. Return `True`, or `False` and change nothing if a file with that name already exists. |
| `get_file_size(name)` | The file's size, or `None` if no such file exists. |
| `delete_file(name)` | Remove the file and return its size, or `None` if no such file exists. |

Names are case-sensitive strings; `/` has no special meaning. Sizes are non-negative integers, and `0` is a valid size. No method raises: missing files are reported with `None` or `False`.

### Example

```python
storage = CloudStorage()
storage.add_file("docs/report.pdf", 2_048)    # True
storage.add_file("docs/report.pdf", 10)       # False (name taken)
storage.get_file_size("docs/report.pdf")      # 2048
storage.get_file_size("docs/missing.pdf")     # None
storage.delete_file("docs/report.pdf")        # 2048
storage.delete_file("docs/report.pdf")        # None
```
