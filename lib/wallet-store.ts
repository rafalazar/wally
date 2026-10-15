import type { Category, Transaction, WalletData } from "./finance.ts";

export type WalletCommand =
  | { type: "add" | "update" | "restore"; transaction: Transaction }
  | { type: "remove"; id: string; version?: number }
  | { type: "add-category"; category: Category };

export type WalletResult = { data: WalletData; previous?: Transaction };
export interface WalletRepository {
  load(): Promise<WalletData>;
  execute(command: WalletCommand): Promise<WalletResult>;
}
