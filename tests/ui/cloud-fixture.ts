import type { Identity } from "@/components/wally/auth-boundary";
import { categories, initialBalanceCategory, localDate, type Transaction } from "@/lib/finance";

// Fake network adapter, only for tests and local isolated browser verification.
export function createCloudFixture(completed = false) {
  const userId = "b6aab28b-d0d0-4c95-9629-9be638a6c263";
  const wallet = { id: "ca1c2712-904f-4735-8d16-0dca49afacbd", owner_id: userId, name: "Mi billetera", kind: "personal", currency_code: "PEN" };
  const state = { completedAt: completed ? "2026-01-01T12:00:00Z" : null as string | null, initialId: null as string | null, transactions: [] as Transaction[] };
  const service = {
    async loadProfile() { return { data: { onboarding_completed_at: state.completedAt, initial_transaction_id: state.initialId }, error: null }; },
    async loadWallets() { return { data: [wallet], error: null }; },
    async complete(amount: number) {
      if (!state.completedAt) {
        state.completedAt = new Date().toISOString(); state.initialId = crypto.randomUUID();
        state.transactions = [{ id: state.initialId, type: "income", category: initialBalanceCategory.id,
          amountCents: amount, paymentMethod: null, description: "Saldo inicial", date: localDate(), createdAt: state.completedAt, version: 1 }];
      }
      return { data: { wallet_id: wallet.id, initial_transaction_id: state.initialId, onboarding_completed_at: state.completedAt }, error: null };
    },
  };
  const client = {
    from(table: string) {
      if (table === "wallets") return { select: () => ({ order: () => service.loadWallets() }) };
      if (table === "profiles") return { select: () => ({ eq: () => ({ single: () => service.loadProfile() }) }) };
      throw new Error(`Unexpected fixture table: ${table}`);
    },
    async rpc(name: string, args: { p_amount_cents?: number }) {
      if (name === "complete_onboarding") return service.complete(args.p_amount_cents!);
      if (name === "get_wallet") return { data: { wallet, categories: [...categories, ...(state.initialId ? [initialBalanceCategory] : [])],
        transactions: state.transactions.map(item => ({ id: item.id, type: item.type, category_id: item.category,
          amount_cents: item.amountCents, description: item.description, payment_method_id: item.paymentMethod,
          occurred_on: item.date, created_at: item.createdAt, version: item.version })) }, error: null };
      throw new Error(`Unexpected fixture RPC: ${name}`);
    },
  };
  const identity = { client, user: { id: userId, user_metadata: { full_name: "Cuenta de prueba" } }, signOut: async () => {} } as unknown as Identity;
  return { identity, service, state };
}
