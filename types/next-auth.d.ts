import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: string
    department: string
    companyKey: string | null
    companyName: string | null
    access: string
    tabs: string[]
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    department: string
    companyKey: string | null
    companyName: string | null
    access: string
    tabs: string[]
  }
}
