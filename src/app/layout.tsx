import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reestrutura - Plataforma de Reestruturação de Vida',
  description: 'Não é um app para usar para sempre. É uma porta de entrada para uma vida mais organizada.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
