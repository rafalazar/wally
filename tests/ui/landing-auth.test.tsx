import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  unsubscribe: vi.fn(),
  onAuthStateChange: vi.fn(),
}));
vi.mock("@/lib/supabase/config", () => ({ supabaseConfig: () => ({ url: "https://example.test", key: "test-public-key" }) }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth }) }));
import { AuthBoundary } from "@/components/wally/auth-boundary";

function Entry() {
  return <AuthBoundary showLanding>{identity => <main><h1>Billetera de {identity.user.id}</h1><button onClick={() => void identity.signOut()}>Salir</button></main>}</AuthBoundary>;
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  auth.signOut.mockResolvedValue({ error: null });
  auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: auth.unsubscribe } } });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState({}, "", "/");
});
afterEach(() => { window.history.replaceState({}, "", "/"); });

test("anonymous visitors can open and leave sign-in without starting OAuth", async () => {
  const user = userEvent.setup();
  render(<Entry />);
  await screen.findByRole("heading", { name: /Tu dinero,\s*sin vueltas\./ });
  await user.click(screen.getByRole("button", { name: "Acceder" }));
  expect(screen.getByRole("heading", { name: "Tus cuentas, contigo." })).toBe(document.activeElement);
  expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Volver al inicio" }));
  expect(screen.getByRole("heading", { name: /Tu dinero,\s*sin vueltas\./ })).toBe(document.activeElement);
  await user.click(screen.getAllByRole("button", { name: "Empezar con Wally" })[0]);
  expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeDefined();
  expect(auth.signInWithOAuth).not.toHaveBeenCalled();
});

test("waits for verified identity and opens the wallet directly; sign-out returns to landing", async () => {
  const user = userEvent.setup();
  let verify!: (value: { data: { user: { id: string } }; error: null }) => void;
  auth.getUser.mockReturnValue(new Promise(resolve => { verify = resolve; }));
  render(<Entry />);
  expect(screen.getByText("Verificando tu sesión...")).toBeDefined();
  expect(screen.queryByRole("heading", { name: /Tu dinero,\s*sin vueltas\./ })).toBeNull();
  await act(async () => { verify({ data: { user: { id: "verified-user" } }, error: null }); });
  await screen.findByRole("heading", { name: "Billetera de verified-user" });
  expect(screen.queryByRole("button", { name: "Acceder" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Salir" }));
  await screen.findByRole("heading", { name: /Tu dinero,\s*sin vueltas\./ });
  expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
});

test("an authentication change takes precedence over a late initial lookup", async () => {
  let verify!: (value: { data: { user: null }; error: null }) => void;
  auth.getUser.mockReturnValue(new Promise(resolve => { verify = resolve; }));
  render(<Entry />);
  const onChange = auth.onAuthStateChange.mock.calls[0][0];
  await act(async () => { onChange("SIGNED_IN", { user: { id: "new-user" } }); });
  await screen.findByRole("heading", { name: "Billetera de new-user" });
  await act(async () => { verify({ data: { user: null }, error: null }); });
  expect(screen.getByRole("heading", { name: "Billetera de new-user" })).toBeDefined();
  await act(async () => { onChange("SIGNED_OUT", null); });
  await screen.findByRole("heading", { name: /Tu dinero,\s*sin vueltas\./ });
});

test("callback errors stay visible at sign-in and the visitor can return home", async () => {
  window.history.replaceState({}, "", "/?auth_error=callback");
  const user = userEvent.setup();
  render(<Entry />);
  await screen.findByRole("alert");
  expect(screen.getByText("No se completó el inicio de sesión con Google. Inténtalo otra vez.")).toBeDefined();
  expect(screen.getByRole("button", { name: "Continuar con Google" })).toBeDefined();
  expect(window.location.search).toBe("");
  await user.click(screen.getByRole("button", { name: "Volver al inicio" }));
  expect(screen.getByRole("heading", { name: /Tu dinero,\s*sin vueltas\./ })).toBe(document.activeElement);
});

test("the example updates its arithmetic, can reset, and never persists a transaction", async () => {
  const store = vi.spyOn(Storage.prototype, "setItem");
  const network = vi.spyOn(globalThis, "fetch");
  const user = userEvent.setup();
  render(<Entry />);
  await screen.findByRole("heading", { name: /Tu dinero,\s*sin vueltas\./ });
  await user.click(screen.getByRole("button", { name: "Otro café de S/ 12" }));
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Saldo S/ 1,391"));
  await user.click(screen.getByRole("button", { name: "Reiniciar ejemplo" }));
  expect(screen.getByRole("status").textContent).toContain("Saldo S/ 1,403");
  expect(store).not.toHaveBeenCalled();
  expect(network).not.toHaveBeenCalled();
});
