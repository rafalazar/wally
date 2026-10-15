import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { CloudWorkspace } from "@/components/wally/cloud-workspace";
import { TransactionDetail, TransactionRow } from "@/components/wally/transaction-history";
import { TransactionForm } from "@/components/wally/transaction-form";
import { useWallet } from "@/components/wally/wally-provider";
import { categories, formatMoney, initialBalanceCategory, summarize, type Transaction } from "@/lib/finance";
import { createCloudFixture } from "./cloud-fixture";
import { createMemoryRepository, WalletFixture } from "./wallet-fixture";

function WalletContent() {
  const wallet = useWallet();
  return <><h1>Tu billetera</h1><p>Saldo disponible: {formatMoney(summarize(wallet.data?.transactions ?? []).balance)}</p>
    <TransactionForm ready={!!wallet.data} onSave={async () => {}} />
    {wallet.data?.transactions.map(item => <TransactionRow key={item.id} transaction={item} onClick={() => {}} />)}</>;
}

function LoadedDetail({ item, onSave }: { item: Transaction; onSave: (item: Transaction) => Promise<void> }) {
  const wallet = useWallet();
  return wallet.data ? <TransactionDetail transaction={item} onDelete={async () => {}} onSave={onSave} /> : null;
}

test('a new Google identity completes one mandatory amount and returns to an expense form with a real balance', async () => {
  const fixture = createCloudFixture();
  const save = vi.spyOn(fixture.service, "complete");
  const user = userEvent.setup();
  const view = render(<CloudWorkspace identity={fixture.identity}><WalletContent /></CloudWorkspace>);
  const amount = await screen.findByLabelText<HTMLInputElement>("Tu saldo inicial");
  expect(screen.queryByLabelText("Billetera")).toBeNull();
  expect(screen.queryByRole("radio")).toBeNull();
  expect(screen.queryByText(/omitir|empezar en cero/i)).toBeNull();
  await user.type(amount, "abc-+0");
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText("Ingresa un monto mayor a 0, con hasta 2 decimales.");
  expect(save).not.toHaveBeenCalled();
  await user.clear(amount);
  await user.type(amount, "125,50");
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText("Tu billetera");
  await screen.findByText(/Saldo disponible: S\/\s*125.50/);
  expect(save).toHaveBeenCalledExactlyOnceWith(12550);
  expect(screen.getByRole("status").textContent).toContain("Tu saldo inicial está listo");
  expect(document.activeElement).toBe(screen.getByRole("status"));
  expect(screen.getByRole<HTMLInputElement>("radio", { name: "Gasto" }).checked).toBe(true);
  expect(screen.queryByRole("radio", { name: /Saldo inicial/ })).toBeNull();
  view.unmount();
  render(<CloudWorkspace identity={fixture.identity}><WalletContent /></CloudWorkspace>);
  await screen.findByText("Tu billetera");
  expect(screen.queryByLabelText("Tu saldo inicial")).toBeNull();
  expect(save).toHaveBeenCalledTimes(1);
});

test('existing empty accounts bypass onboarding and focus refresh detects completion from another tab', async () => {
  const existing = createCloudFixture(true);
  const first = render(<CloudWorkspace identity={existing.identity}><WalletContent /></CloudWorkspace>);
  await screen.findByText("Tu billetera");
  expect(screen.queryByLabelText("Tu saldo inicial")).toBeNull();
  first.unmount();
  const fresh = createCloudFixture();
  render(<CloudWorkspace identity={fresh.identity}><WalletContent /></CloudWorkspace>);
  await screen.findByLabelText("Tu saldo inicial");
  await fresh.service.complete(20000);
  fireEvent(window, new Event("focus"));
  await screen.findByText("Tu billetera");
  await screen.findByText(/Saldo disponible: S\/\s*200.00/);
});

test('profile loading and errors never expose the workspace and support retry', async () => {
  const fixture = createCloudFixture();
  const fetch = vi.spyOn(fixture.service, "loadProfile").mockRejectedValueOnce(new Error("No pudimos cargar tu perfil."));
  render(<CloudWorkspace identity={fixture.identity}><WalletContent /></CloudWorkspace>);
  expect(screen.queryByText("Tu billetera")).toBeNull();
  await screen.findByText("No pudimos cargar tu perfil.");
  expect(screen.queryByLabelText("Tu saldo inicial")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  await screen.findByLabelText("Tu saldo inicial");
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('failed save preserves the draft and prevents a second submit while pending', async () => {
  const fixture = createCloudFixture();
  const save = vi.spyOn(fixture.service, "complete").mockRejectedValueOnce(new Error("Sin conexión. Inténtalo otra vez."));
  const user = userEvent.setup();
  render(<CloudWorkspace identity={fixture.identity}><WalletContent /></CloudWorkspace>);
  const amount = await screen.findByLabelText<HTMLInputElement>("Tu saldo inicial");
  await user.type(amount, "45.50");
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText("Sin conexión. Inténtalo otra vez.");
  expect(amount.value).toBe("45.50");
  let reject!: (error: Error) => void;
  save.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
  const form = amount.closest("form")!;
  fireEvent.submit(form); fireEvent.submit(form);
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "Guardando tu saldo..." }).disabled).toBe(true);
  reject(new Error("Reintenta el guardado."));
  await screen.findByText("Reintenta el guardado.");
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText("Tu billetera");
  expect(fixture.state.transactions).toHaveLength(1);
});

test('a committed RPC followed by a failed refresh can be retried without losing or duplicating the balance', async () => {
  const fixture = createCloudFixture();
  const user = userEvent.setup();
  render(<CloudWorkspace identity={fixture.identity}><WalletContent /></CloudWorkspace>);
  const amount = await screen.findByLabelText<HTMLInputElement>("Tu saldo inicial");
  vi.spyOn(fixture.service, "loadProfile").mockRejectedValueOnce(new Error("No pudimos actualizar tu billetera."));
  await user.type(amount, "50");
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText("No pudimos actualizar tu billetera.");
  expect(amount.value).toBe("50.00");
  const originalId = fixture.state.initialId;
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText("Tu billetera");
  expect(fixture.state.transactions).toHaveLength(1);
  expect(fixture.state.initialId).toBe(originalId);
});

test('sign out remains available on the required welcome', async () => {
  const fixture = createCloudFixture();
  const signOut = vi.spyOn(fixture.identity, "signOut");
  render(<CloudWorkspace identity={fixture.identity}><WalletContent /></CloudWorkspace>);
  await screen.findByLabelText("Tu saldo inicial");
  await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(signOut).toHaveBeenCalledOnce();
});

test('initial balance detail and editing omit method and preserve income identity', async () => {
  const item: Transaction = { id: "initial", type: "income", category: initialBalanceCategory.id, description: "Saldo inicial", amountCents: 12550,
    paymentMethod: null, date: "2026-01-01", createdAt: "2026-01-01T12:00:00Z", version: 1 };
  const repository = createMemoryRepository([item], [...categories, initialBalanceCategory]);
  const save = vi.fn(async () => {});
  const user = userEvent.setup();
  render(<WalletFixture repository={repository}><LoadedDetail item={item} onSave={save} /></WalletFixture>);
  await screen.findByRole("heading", { name: "Saldo inicial" });
  expect(screen.queryByText("Método")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Editar movimiento" }));
  expect(screen.queryByRole("radio")).toBeNull();
  const amount = screen.getByLabelText("Monto en soles");
  await user.clear(amount); await user.type(amount, "150");
  await user.clear(screen.getByLabelText("Detalle del ingreso (opcional)"));
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  expect(save).toHaveBeenCalledWith({ ...item, amountCents: 15000, description: "" });
});
