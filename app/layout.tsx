import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AASX Schema Validator',
  description: 'AASX Schema Validator for ensuring compliance with official schema standards',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}