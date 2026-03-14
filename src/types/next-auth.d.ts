import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    companyId: string
  }
  interface Session {
    user: {
      id: string
      companyId: string
      email: string
      name: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    companyId: string
  }
}
