import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/lib/auth"
import { ThemeProvider } from "@/components/theme-provider"
import { LinkHandler } from "@/components/link-handler"
import { CommandPalette } from "@/components/command-palette"

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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SessionProvider session={session}>
            <LinkHandler />
            <CommandPalette />
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
