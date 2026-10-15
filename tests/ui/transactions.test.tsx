import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { TransactionDetail, TransactionRow } from "@/components/wally/transaction-history";
import type { Transaction } from "@/lib/finance";
import { createMemoryRepository, FormFixture, WalletFixture } from "./wallet-fixture";

async function setup(initial?: Transaction) {
  const repository = createMemoryRepository(initial ? [initial] : []);
  const execute = vi.spyOn(repository, "execute");
  const user = userEvent.setup();
  render(<WalletFixture repository={repository}><FormFixture initial={initial} /></WalletFixture>);
  const amount = screen.getByRole<HTMLInputElement>("textbox", { name: "Monto en soles" });
  await waitFor(() => expect(amount.matches(":disabled")).toBe(false));
  return { user, amount, repository, execute };
}

describe("consecutive transactions", () => {
  test.each([
    ["Ingreso", "income", "Honorarios", "freelance", "Efectivo", "cash"],
    ["Gasto", "expense", "Transporte", "transport", "Crédito", "credit"],
  ] as const)("preserves %s, category and payment method after saving", async (label, type, category, categoryId, payment, paymentMethod) => {
    const { user, amount, repository } = await setup();
    await user.click(screen.getByRole("radio", { name: label }));
    await user.click(await screen.findByRole("radio", { name: new RegExp(category) }));
    await user.click(screen.getByRole("radio", { name: new RegExp(payment) }));
    for (const value of ["125,50", "200"]) {
      await user.type(amount, value);
      expect(screen.getByRole<HTMLInputElement>("radio", { name: label }).checked).toBe(true);
      await user.click(screen.getByRole("button", { name: `Registrar ${label.toLowerCase()}` }));
      await waitFor(() => expect(amount.value).toBe(""));
      expect(screen.getByRole<HTMLInputElement>("radio", { name: label }).checked).toBe(true);
      expect(screen.getByRole<HTMLInputElement>("radio", { name: new RegExp(category) }).checked).toBe(true);
      expect(screen.getByRole<HTMLInputElement>("radio", { name: new RegExp(payment) }).checked).toBe(true);
    }
    const data = await repository.load();
    expect(data.transactions).toHaveLength(2);
    expect(new Set(data.transactions.map(item => item.id)).size).toBe(2);
    expect(data.transactions.map(item => item.amountCents)).toEqual([20000, 12550]);
    for (const item of data.transactions) expect(item).toMatchObject({ type, category: categoryId, paymentMethod, description: "" });
  });

  test("preserves a failed draft and lets the user retry or explicitly switch type", async () => {
    const { user, amount, execute, repository } = await setup();
    await user.click(screen.getByRole("radio", { name: "Ingreso" }));
    await user.type(amount, "100");
    await user.type(screen.getByLabelText("Detalle del ingreso (opcional)"), "Mi nota");
    execute.mockRejectedValueOnce(new Error("Sin conexión. Inténtalo otra vez."));
    await user.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    await screen.findByText("Sin conexión. Inténtalo otra vez.");
    expect(amount.value).toBe("100.00");
    expect(screen.getByRole<HTMLInputElement>("radio", { name: "Ingreso" }).checked).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>("Detalle del ingreso (opcional)").value).toBe("Mi nota");
    await user.click(screen.getByRole("button", { name: "Registrar ingreso" }));
    await waitFor(() => expect(amount.value).toBe(""));
    expect((await repository.load()).transactions).toHaveLength(1);
    await user.click(screen.getByRole("radio", { name: "Gasto" }));
    await user.type(amount, "50");
    expect(screen.getByRole<HTMLInputElement>("radio", { name: "Gasto" }).checked).toBe(true);
  });
});

describe("amount input", () => {
  test("blocks text, signs, extra decimals and oversized numbers without changing accepted money", async () => {
    const { user, amount } = await setup();
    await user.type(amount, "abc-+e");
    expect(amount.value).toBe("");
    await user.type(amount, "12,34");
    await user.type(amount, "5x.");
    expect(amount.value).toBe("12,34");
    await user.clear(amount);
    await user.type(amount, "1234567890");
    expect(amount.value).toBe("123456789");
    await user.clear(amount);
    await user.type(amount, "0");
    await user.click(screen.getByRole("button", { name: "Registrar gasto" }));
    await screen.findByText("Ingresa un monto mayor a 0, con hasta 2 decimales.");
  });

  test("rejects a whole invalid paste and supports selection, shortcuts and decimal comma", async () => {
    const { user, amount } = await setup();
    await user.type(amount, "125");
    for (const text of ["S/ 125", "12abc", "999999999.99abc", "1,000.00"]) {
      amount.select();
      await user.paste(text);
      expect(amount.value).toBe("125");
    }
    amount.select();
    await user.paste("88,50");
    expect(amount.value).toBe("88,50");
    amount.setSelectionRange(0, 2);
    await user.keyboard("12");
    expect(amount.value).toBe("12,50");
    await user.keyboard("{Control>}a{/Control}{Backspace}");
    expect(amount.value).toBe("");
    await user.paste("25.75");
    await user.tab();
    expect(amount.value).toBe("25.75");
  });

  test("guards alternate input events and quick amounts", async () => {
    const { user, amount } = await setup();
    fireEvent.change(amount, { target: { value: "12abc" } });
    expect(amount.value).toBe("");
    await user.type(amount, "20");
    expect(fireEvent.drop(amount, { dataTransfer: { getData: () => "S/ 100" } })).toBe(false);
    expect(amount.value).toBe("20");
    await user.click(screen.getByRole("button", { name: "Sumar 10 soles" }));
    expect(amount.value).toBe("30.00");
  });
});

const transaction: Transaction = {
  id: "existing", type: "income", amountCents: 850, description: "Nota anterior", category: "salary",
  paymentMethod: "transfer", date: "2026-01-01", createdAt: "2026-01-01T12:00:00Z", version: 1,
};

test("an existing note can be cleared while preserving the transaction identity and type", async () => {
  const { user, repository } = await setup(transaction);
  await user.clear(screen.getByLabelText("Detalle del ingreso (opcional)"));
  await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
  await waitFor(async () => expect((await repository.load()).transactions[0].description).toBe(""));
  expect((await repository.load()).transactions[0]).toMatchObject({ id: "existing", type: "income", amountCents: 850, version: 2 });
});

test("rows and detail headings use the category when the note is empty", async () => {
  const item = { ...transaction, description: "" };
  const repository = createMemoryRepository([item]);
  render(<WalletFixture repository={repository}>
    <TransactionRow transaction={item} onClick={() => {}} />
    <TransactionDetail transaction={item} onDelete={async () => {}} onSave={async () => {}} />
  </WalletFixture>);
  expect(screen.getByRole("button", { name: /Ver detalle: Sueldo, ingreso/ })).toBeDefined();
  expect(screen.getByRole("heading", { name: "Sueldo" })).toBeDefined();
});
