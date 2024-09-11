import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Acupuncture Gift Card',
  description: 'Purchase a gift card for acupuncture sessions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 text-gray-900 min-h-screen`}>
        <main className="container mx-auto py-8 px-4">
          {children}
        </main>

      </body>
    </html>
  )
}
