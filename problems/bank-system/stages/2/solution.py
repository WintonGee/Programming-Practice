from dataclasses import dataclass


@dataclass
class Account:
    balance: int = 0
    outgoing: int = 0


class BankingSystem:
    def __init__(self) -> None:
        self.accounts: dict[str, Account] = {}

    def create_account(self, timestamp: int, account_id: str) -> bool:
        if account_id in self.accounts:
            return False
        self.accounts[account_id] = Account()
        return True

    def deposit(self, timestamp: int, account_id: str, amount: int) -> int | None:
        account = self.accounts.get(account_id)
        if account is None:
            return None
        account.balance += amount
        return account.balance

    def transfer(self, timestamp: int, source_account_id: str, target_account_id: str, amount: int) -> int | None:
        source = self.accounts.get(source_account_id)
        target = self.accounts.get(target_account_id)
        if source is None or target is None or source_account_id == target_account_id:
            return None
        if source.balance < amount:
            return None
        source.balance -= amount
        source.outgoing += amount
        target.balance += amount
        return source.balance

    def top_spenders(self, timestamp: int, n: int) -> list[str]:
        ranked = sorted(self.accounts.items(), key=lambda item: (-item[1].outgoing, item[0]))
        return [f"{account_id}({account.outgoing})" for account_id, account in ranked[:n]]
