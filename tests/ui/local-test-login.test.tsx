import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

// Exercise the real development branch, with no Supabase configuration or API.
vi.hoisted(() => { vi.stubEnv("NODE_ENV", "development"); });
vi.mock("@/lib/supabase/config", () => ({ supabaseConfig: () => null }));
import { WallyApp } from "@/components/wally/wally-app";
import { localTestSessionSnapshot, LOCAL_TEST_SESSION_KEY } from "@/lib/local-test-access";
import { LOCAL_TEST_WALLET_KEY } from "@/lib/local-test-wallet";

beforeEach(() => { vi.stubEnv("NODE_ENV", "development"); });
afterEach(() => { sessionStorage.clear(); vi.unstubAllEnvs(); });

test('test user enters without Google, persists after reload, signs out and resets the welcome', { timeout: 15000 }, async () => {
  const network = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network must not be used"));
  const user = userEvent.setup();
  const view = render(<WallyApp />);
  await user.click(await screen.findByRole("button", { name: "Entrar como usuario de prueba" }));
  const amount = await screen.findByLabelText("Tu saldo inicial");
  await user.type(amount, "1250,50");
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText(/Tu saldo inicial está listo/);
  expect(JSON.parse(localStorage.getItem(LOCAL_TEST_WALLET_KEY)!).wallet.transactions).toHaveLength(1);
  await user.type(screen.getByRole("textbox", { name: "Monto en soles" }), "25");
  await user.click(screen.getByRole("button", { name: "Registrar gasto" }));
  await waitFor(() => expect(JSON.parse(localStorage.getItem(LOCAL_TEST_WALLET_KEY)!).wallet.transactions).toHaveLength(2));
  view.unmount();
  render(<WallyApp />);
  await screen.findByText("Guardado en este navegador");
  expect(screen.queryByLabelText("Tu saldo inicial")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
  await user.click(await screen.findByRole("button", { name: "Entrar como usuario de prueba" }));
  await screen.findByText("Guardado en este navegador");
  await user.click(screen.getByRole("button", { name: "Reiniciar prueba" }));
  await screen.findByLabelText("Tu saldo inicial");
  expect(JSON.parse(localStorage.getItem(LOCAL_TEST_WALLET_KEY)!).wallet.transactions).toHaveLength(0);
  await user.type(screen.getByLabelText("Tu saldo inicial"), "99");
  await user.click(screen.getByRole("button", { name: "Reiniciar prueba" }));
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Tu saldo inicial" }).value).toBe("");
  expect(network).not.toHaveBeenCalled();
});

test('production ignores a previously stored development session and hides test access', async () => {
  vi.stubEnv("NODE_ENV", "production");
  sessionStorage.setItem(LOCAL_TEST_SESSION_KEY, "active");
  expect(localTestSessionSnapshot()).toBe(0);
  render(<WallyApp />);
  await screen.findByRole("button", { name: "Continuar con Google" });
  expect(screen.queryByRole("button", { name: "Entrar como usuario de prueba" })).toBeNull();
  expect(screen.queryByLabelText("Tu saldo inicial")).toBeNull();
});

test('a blocked local save keeps the amount and does not report success', async () => {
  const user = userEvent.setup();
  render(<WallyApp />);
  await user.click(await screen.findByRole("button", { name: "Entrar como usuario de prueba" }));
  await user.type(await screen.findByLabelText("Tu saldo inicial"), "50");
  const save = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText(/No pudimos guardar en este navegador/);
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Tu saldo inicial" }).value).toBe("50.00");
  expect(screen.queryByText(/Tu saldo inicial está listo/)).toBeNull();
  save.mockRestore();
  await user.click(screen.getByRole("button", { name: "Empezar con este monto" }));
  await screen.findByText(/Tu saldo inicial está listo/);
});
