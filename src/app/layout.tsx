import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SelfBank - Buscador de Fondos',
  description: 'Encuentra los mejores fondos de inversión con SelfBank',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  )
} 