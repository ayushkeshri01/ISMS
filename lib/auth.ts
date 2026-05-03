import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { ROLE_ACCESS } from "@/lib/constants"

const VALID_ROLES = ['CIO', 'IT_MANAGER', 'STQM_MANAGER', 'HR_MANAGER', 'ADMIN_FACILITIES', 'LEGAL', 'MD_CEO', 'IT_EXECUTIVE', 'HR_EXECUTIVE'] as const

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "",
  providers: [
    Credentials({
      name: "PIN",
      credentials: {
        pin: { label: "PIN", type: "password", placeholder: "Enter 4-digit PIN" }
      },
      async authorize(credentials) {
        if (!credentials?.pin) return null
        
        const pin = credentials.pin as string
        
        // Validate PIN format
        if (!/^\d{4}$/.test(pin)) return null
        
        const user = await prisma.user.findUnique({
          where: { pin },
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
            companyKey: true,
            company: { select: { name: true } }
          }
        })
        
        if (!user) return null
        
        // Validate role
        if (!VALID_ROLES.includes(user.role as typeof VALID_ROLES[number])) return null
        
        const roleAccess = ROLE_ACCESS[user.role as keyof typeof ROLE_ACCESS] || { access: "maker", tabs: ["overview", "log"] }
        
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          department: user.department,
          companyKey: user.companyKey,
          companyName: user.company?.name ?? null,
          access: roleAccess.access,
          tabs: roleAccess.tabs
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60 // 8 hours
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.department = token.department as string
        session.user.companyKey = token.companyKey as string | null
        session.user.companyName = token.companyName as string | null
        session.user.access = token.access as string
        session.user.tabs = token.tabs as string[]
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.department = user.department
        token.companyKey = user.companyKey
        token.companyName = user.companyName
        token.access = user.access
        token.tabs = user.tabs
      }
      return token
    }
  },
  debug: process.env.NODE_ENV === "development"
})
