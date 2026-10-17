import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./workspace.css";
import "./select.css";
import "./landing.css";

const jakarta = localFont({
  src: "./fonts/PlusJakartaSans.ttf",
  variable: "--font-jakarta",
  weight: "200 800",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wally · Tu dinero, sin vueltas",
  description: "Registra tus ingresos y gastos en soles, entiende tus cuentas y sigue con tu día. Tu billetera personal y, si quieres, una para compartir.",
  applicationName: "Wally",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es" data-scroll-behavior="smooth" className={jakarta.variable}><body>{children}</body></html>;
}
