import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Painel Zap – Memory Repository",
  description: "Repositório central de memórias para seus projetos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
