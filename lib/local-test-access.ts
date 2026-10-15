export const LOCAL_TEST_SESSION_KEY = "wally.development.session.v1";
const sessionEvent = "wally:development-session";

export function isLocalDevelopmentHost(mode: string | undefined, hostname: string) {
  return mode === "development" && ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
}

// 0: unavailable, 1: can enter, 2: active test session. Never a Supabase identity.
export function localTestSessionSnapshot() {
  if (typeof window === "undefined" || !isLocalDevelopmentHost(process.env.NODE_ENV, window.location.hostname)) return 0;
  try { return sessionStorage.getItem(LOCAL_TEST_SESSION_KEY) === "active" ? 2 : 1; }
  catch { return 1; }
}
export const localTestServerSnapshot = () => 0;
export function subscribeLocalTestSession(listener: () => void) {
  window.addEventListener(sessionEvent, listener);
  window.addEventListener("storage", listener);
  return () => { window.removeEventListener(sessionEvent, listener); window.removeEventListener("storage", listener); };
}
export function setLocalTestSession(active: boolean) {
  if (!localTestSessionSnapshot()) throw new Error("El usuario de prueba solo está disponible en desarrollo local.");
  try {
    if (active) sessionStorage.setItem(LOCAL_TEST_SESSION_KEY, "active");
    else sessionStorage.removeItem(LOCAL_TEST_SESSION_KEY);
  } catch { throw new Error("Permite el almacenamiento de este navegador para usar la cuenta de prueba."); }
  window.dispatchEvent(new Event(sessionEvent));
}
