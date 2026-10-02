from bisect import bisect_right
from collections import deque
from dataclasses import dataclass

CASHBACK_DELAY_MS = 86_400_000
CASHBACK_PERCENT = 2


@dataclass
class Account:
    balance: int = 0
    outgoing: int = 0


@dataclass
class Payment:
    account_id: str
    cashback: int
    due_at: int
    received: bool = False


class BankingSystem:
    def __init__(self) -> None:
        self.accounts: dict[str, Account] = {}
        self.payments: dict[str, Payment] = {}
        # Timestamps strictly increase, so payments are queued in due order.
        self.pending: deque[Payment] = deque()
        # account_id -> [(timestamp, balance)], balance None once the id is merged away
        self.history: dict[str, list[tuple[int, int | None]]] = {}

    def _record(self, account_id: str, timestamp: int) -> None:
        account = self.accounts.get(account_id)
        balance = account.balance if account is not None else None
        self.history.setdefault(account_id, []).append((timestamp, balance))

    def _process_cashbacks(self, timestamp: int) -> None:
        while self.pending and self.pending[0].due_at <= timestamp:
            payment = self.pending.popleft()
            self.accounts[payment.account_id].balance += payment.cashback
            payment.received = True
            self._record(payment.account_id, payment.due_at)

    def create_account(self, timestamp: int, account_id: str) -> bool:
        self._process_cashbacks(timestamp)
        if account_id in self.accounts:
            return False
        self.accounts[account_id] = Account()
        self._record(account_id, timestamp)
        return True

    def deposit(self, timestamp: int, account_id: str, amount: int) -> int | None:
        self._process_cashbacks(timestamp)
        account = self.accounts.get(account_id)
        if account is None:
            return None
        account.balance += amount
        self._record(account_id, timestamp)
        return account.balance

    def transfer(self, timestamp: int, source_account_id: str, target_account_id: str, amount: int) -> int | None:
        self._process_cashbacks(timestamp)
        source = self.accounts.get(source_account_id)
        target = self.accounts.get(target_account_id)
        if source is None or target is None or source_account_id == target_account_id:
            return None
        if source.balance < amount:
            return None
        source.balance -= amount
        source.outgoing += amount
        target.balance += amount
        self._record(source_account_id, timestamp)
        self._record(target_account_id, timestamp)
        return source.balance

    def top_spenders(self, timestamp: int, n: int) -> list[str]:
        self._process_cashbacks(timestamp)
        ranked = sorted(self.accounts.items(), key=lambda item: (-item[1].outgoing, item[0]))
        return [f"{account_id}({account.outgoing})" for account_id, account in ranked[:n]]

    def pay(self, timestamp: int, account_id: str, amount: int) -> str | None:
        self._process_cashbacks(timestamp)
        account = self.accounts.get(account_id)
        if account is None or account.balance < amount:
            return None
        account.balance -= amount
        account.outgoing += amount
        self._record(account_id, timestamp)
        payment_id = f"payment{len(self.payments) + 1}"
        payment = Payment(
            account_id=account_id,
            cashback=amount * CASHBACK_PERCENT // 100,
            due_at=timestamp + CASHBACK_DELAY_MS,
        )
        self.payments[payment_id] = payment
        self.pending.append(payment)
        return payment_id

    def get_payment_status(self, timestamp: int, account_id: str, payment: str) -> str | None:
        self._process_cashbacks(timestamp)
        record = self.payments.get(payment)
        if account_id not in self.accounts or record is None or record.account_id != account_id:
            return None
        return "CASHBACK_RECEIVED" if record.received else "IN_PROGRESS"

    def merge_accounts(self, timestamp: int, account_id_1: str, account_id_2: str) -> bool:
        self._process_cashbacks(timestamp)
        if account_id_1 == account_id_2:
            return False
        survivor = self.accounts.get(account_id_1)
        merged = self.accounts.get(account_id_2)
        if survivor is None or merged is None:
            return False
        survivor.balance += merged.balance
        survivor.outgoing += merged.outgoing
        for payment in self.payments.values():
            if payment.account_id == account_id_2:
                payment.account_id = account_id_1
        del self.accounts[account_id_2]
        self._record(account_id_1, timestamp)
        self._record(account_id_2, timestamp)
        return True

    def get_balance(self, timestamp: int, account_id: str, time_at: int) -> int | None:
        self._process_cashbacks(timestamp)
        events = self.history.get(account_id, [])
        i = bisect_right(events, time_at, key=lambda event: event[0])
        return events[i - 1][1] if i else None
