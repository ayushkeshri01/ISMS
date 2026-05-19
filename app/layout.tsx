import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { LinkHandler } from "@/components/link-handler"
import { CommandPalette } from "@/components/command-palette"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VG ISMS Portal",
  description: "Vikas Group Information Security Management System",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#09090b" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider session={session}>
            <LinkHandler />
            <CommandPalette />
            <Toaster />
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
