import type { Metadata } from 'next'
import { Providers } from './providers'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ThemeProvider } from '@/components/custom/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'WB Repricer System',
  description: 'Financial dashboard for Wildberries marketplace sellers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
