The bank launches card **payments** with **cashback**. A payment withdraws money immediately; a 2% cashback lands in the same account exactly one day later.

### New operations

| Method | Behavior |
|---|---|
| `pay(timestamp, account_id, amount)` | Withdraw `amount` from the account. Return a payment id, or `None` and change nothing if the account doesn't exist or its balance is less than `amount`. Paying the entire balance is allowed. |
| `get_payment_status(timestamp, account_id, payment)` | `"IN_PROGRESS"` if the payment's cashback hasn't been credited yet, `"CASHBACK_RECEIVED"` if it has. Return `None` if the account doesn't exist, the payment id doesn't exist, or the payment was made by a different account. |

### Rules

- **Payment ids** are `"payment1"`, `"payment2"`, … numbered by a single counter shared across all accounts. Only successful payments consume a number.
- **Cashback** is `amount * 2 // 100` (2%, rounded down; it may be `0`). It is credited at timestamp `payment_timestamp + 86_400_000` (one day in milliseconds).
- A cashback due at time `T` must be credited **before** any operation with timestamp `>= T` does anything else. So a call at exactly `T` already sees the cashback in the balance, and its status is `"CASHBACK_RECEIVED"`. A zero cashback still changes the status at `T`.
- A payment counts toward the account's outgoing total in `top_spenders`. Cashback does **not** reduce the outgoing total.

All Stage 1–2 behavior still applies.

### Example

```python
DAY = 86_400_000
bank = BankingSystem()
bank.create_account(1, "alice")
bank.deposit(2, "alice", 100_000)
bank.pay(3, "alice", 25_000)                            # "payment1"  (balance 75000)
bank.get_payment_status(4, "alice", "payment1")         # "IN_PROGRESS"
bank.deposit(3 + DAY - 1, "alice", 1)                   # 75001  (cashback not yet due)
bank.get_payment_status(3 + DAY, "alice", "payment1")   # "CASHBACK_RECEIVED"
bank.deposit(3 + DAY + 1, "alice", 1)                   # 75502  (75001 + 500 cashback + 1)
bank.top_spenders(3 + DAY + 2, 1)                       # ["alice(25000)"]
```
