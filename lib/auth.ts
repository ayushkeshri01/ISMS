import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { ROLE_ACCESS } from "@/lib/constants"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "",
  providers: [
    Credentials({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp:   { label: "OTP",   type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim()
        const otp   = (credentials?.otp   as string | undefined)?.trim()

        if (!email || !otp) return null

        if (!/^\d{6}$/.test(otp)) return null

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
            companyKey: true,
            otp: true,
            otpExpiresAt: true,
            company: { select: { name: true } },
          },
        })

        if (!user) return null
        if (!user.otp || !user.otpExpiresAt) return null
        if (user.otp !== otp) return null
        if (new Date() > user.otpExpiresAt) return null

        await prisma.user.update({
          where: { id: user.id },
          data: { otp: null, otpExpiresAt: null, emailVerified: new Date() },
        })

        const roleAccess =
          ROLE_ACCESS[user.role as keyof typeof ROLE_ACCESS] ||
          { access: "maker", tabs: ["overview", "log"] }

        return {
          id:          user.id,
          name:        user.name,
          role:        user.role,
          department:  user.department,
          companyKey:  user.companyKey,
          companyName: user.company?.name ?? null,
          access:      roleAccess.access,
          tabs:        roleAccess.tabs,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id          = token.id          as string
        session.user.name        = token.name        as string
        session.user.role        = token.role        as string
        session.user.department  = token.department  as string
        session.user.companyKey  = token.companyKey  as string | null
        session.user.companyName = token.companyName as string | null
        session.user.access      = token.access      as string
        session.user.tabs        = token.tabs        as string[]
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id
        token.role        = user.role
        token.department  = user.department
        token.companyKey  = user.companyKey
        token.companyName = user.companyName
        token.access      = user.access
        token.tabs        = user.tabs
      }
      return token
    },
  },
  debug: process.env.NODE_ENV === "development",
})
