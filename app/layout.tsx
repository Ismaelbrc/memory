import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FreteControl - Sistema de Gestão de Fretes',
  description: 'Sistema de gestão de CIOT e PEF para transporte de carga no Brasil',
  keywords: 'CIOT, PEF, frete, transporte, carga, ANTT, RNTRC',
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
