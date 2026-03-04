import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export const metadata: Metadata = {
  title: 'Reestrutura - Plataforma de Reestruturação de Vida',
  description: 'Não é um app para usar para sempre. É uma porta de entrada para uma vida mais organizada.',
}

// Inline script to set theme before first paint (prevents flash of wrong theme)
const themeScript = `(function(){try{var t=localStorage.getItem('tasktotask-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
