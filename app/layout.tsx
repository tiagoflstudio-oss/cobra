import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Confia Snake | O Jogo Independente",
  description: "Divirta-se jogando o clássico Snake retrô de forma independente e dispute o topo do ranking global!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-[#070708] text-zinc-100 min-h-screen antialiased">
        {children}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
