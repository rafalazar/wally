import type { ReactNode } from "react";
import { categories, walletSchema, type Category, type Transaction, type WalletData } from "@/lib/finance";
import type { WalletRepository } from "@/lib/wallet-store";
import { TransactionForm } from "@/components/wally/transaction-form";
import { WallyProvider, useWallet } from "@/components/wally/wally-provider";

// In-memory repository for component tests and isolated browser verification only.
export function createMemoryRepository(transactions: Transaction[] = [], catalog: readonly Category[] = categories): WalletRepository {
  let data: WalletData = { version: 1, currency: "PEN", categories: [...catalog], transactions };
  return {
    async load() { return data; },
    async execute(command) {
      if (command.type === "add-category") {
        data = walletSchema.parse({ ...data, categories: [...data.categories, command.category] });
        return { data };
      }
      const id = command.type === "remove" ? command.id : command.transaction.id;
      const previous = data.transactions.find(item => item.id === id);
      const remaining = data.transactions.filter(item => item.id !== id);
      data = walletSchema.parse({ ...data, transactions: command.type === "remove" ? remaining : [
        { ...command.transaction, version: (previous?.version ?? 0) + 1 }, ...remaining,
      ] });
      return { data, previous };
    },
  };
}

export function WalletFixture({ repository, children }: { repository: WalletRepository; children: ReactNode }) {
  return <WallyProvider repository={repository} scope="component-test" displayName="Prueba" signOut={async () => {}}>
    {children}
  </WallyProvider>;
}

export function FormFixture({ initial }: { initial?: Transaction }) {
  const wallet = useWallet();
  return <TransactionForm ready={!!wallet.data} initial={initial} onSave={async transaction => {
    await wallet.execute({ type: initial ? "update" : "add", transaction });
  }} />;
}
