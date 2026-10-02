The risk team wants to see who moves the most money out. Add a ranking of accounts by **outgoing** volume.

### New operation

| Method | Behavior |
|---|---|
| `top_spenders(timestamp, n)` | The top `n` accounts by total outgoing amount, as strings formatted `"<account_id>(<total_outgoing>)"`. Sort by total **descending**, break ties by account id **ascending**. If fewer than `n` accounts exist, return them all. Returns `[]` when there are no accounts. |

### Rules

- An account's total outgoing is the sum of every **successful** transfer it sent.
- Deposits and incoming transfers do not count. Failed transfers (returned `None`) do not count.
- Every existing account appears in the ranking, including accounts with a total of `0`.

All Stage 1 behavior still applies.

### Example

```python
bank = BankingSystem()
bank.create_account(1, "alice")
bank.create_account(2, "bob")
bank.create_account(3, "carol")
bank.deposit(4, "alice", 5_000)
bank.deposit(5, "bob", 5_000)
bank.transfer(6, "alice", "bob", 1_500)
bank.transfer(7, "bob", "carol", 400)
bank.transfer(8, "alice", "carol", 500)
bank.top_spenders(9, 2)     # ["alice(2000)", "bob(400)"]
bank.top_spenders(10, 5)    # ["alice(2000)", "bob(400)", "carol(0)"]
```
