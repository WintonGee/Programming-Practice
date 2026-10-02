Users want to find what's eating their space. Add a query for the largest files under a path prefix.

### New operation

| Method | Behavior |
|---|---|
| `get_n_largest(prefix, n)` | The `n` largest files whose name **starts with** `prefix`, as strings formatted `"<name>(<size>)"`. Sort by size **descending**, break ties by name **ascending**. If fewer than `n` files match, return them all. Returns `[]` if nothing matches or `n` is `0`. |

`prefix` is a plain string prefix, not a directory: `"dir1"` matches `"dir1/a.txt"` **and** `"dir10/b.txt"`. An empty prefix matches every file. All Stage 1 behavior still applies.

### Example

```python
storage = CloudStorage()
storage.add_file("dir1/a.txt", 100)
storage.add_file("dir1/b.txt", 300)
storage.add_file("dir1/c.txt", 100)
storage.add_file("dir2/d.txt", 500)
storage.get_n_largest("dir1/", 2)     # ["dir1/b.txt(300)", "dir1/a.txt(100)"]
storage.get_n_largest("dir1/", 10)    # ["dir1/b.txt(300)", "dir1/a.txt(100)", "dir1/c.txt(100)"]
storage.get_n_largest("dir3/", 5)     # []
```
