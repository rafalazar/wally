import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./workspace.css";
import "./select.css";

const jakarta = localFont({
  src: "./fonts/PlusJakartaSans.ttf",
  variable: "--font-jakarta",
  weight: "200 800",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wally · Tu billetera diaria inteligente",
  description: "Un poco de orden, mucha tranquilidad. Registra tus ingresos y gastos y lleva tus cuentas personales con Wally.",
  applicationName: "Wally",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es" data-scroll-behavior="smooth" className={jakarta.variable}><body>{children}</body></html>;
}
