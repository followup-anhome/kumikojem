import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const companyUser = await prisma.companyUser.findUnique({
          where: { email: credentials.email },
          include: { company: true },
        })
        if (!companyUser) return null
        const valid = await bcrypt.compare(credentials.password, companyUser.password_hash)
        if (!valid) return null
        return {
          id: companyUser.id,
          email: companyUser.email,
          name: companyUser.company.name,
          companyId: companyUser.company_id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.companyId = user.companyId
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.companyId = token.companyId
      }
      return session
    },
  },
  pages: {
    signIn: "/company/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
}
