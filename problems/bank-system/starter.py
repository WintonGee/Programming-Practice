class BankingSystem:
    def __init__(self) -> None:
        raise NotImplementedError

    def create_account(self, timestamp: int, account_id: str) -> bool:
        # Open a new account with balance 0; False if the id is taken
        raise NotImplementedError

    def deposit(self, timestamp: int, account_id: str, amount: int) -> int | None:
        # Add `amount` cents; returns the new balance, or None if the account is unknown
        raise NotImplementedError

    def transfer(self, timestamp: int, source_account_id: str, target_account_id: str, amount: int) -> int | None:
        # Move `amount` cents; returns the source's new balance, or None if the transfer is invalid
        raise NotImplementedError


def main() -> None:
    # Scratch space: try your class out here, then use "Run file".
    print("Hello, BankingSystem!")


if __name__ == "__main__":
    main()
