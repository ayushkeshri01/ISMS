import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AuthRedirectPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }
  
  const redirectUrl = session.user.companyKey
    ? `/dashboard/${session.user.companyKey}`
    : "/dashboard/master"
  
  redirect(redirectUrl)
}
