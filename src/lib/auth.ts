import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export { CHECK_IN_ROLES, EVALUATE_ROLES } from "./roles";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Known seed credentials are never accepted by a production build.
        if (process.env.NODE_ENV === "production" && credentials.password === "admin123" && ["admin@tvvc.org", "evaluator@tvvc.org", "checkin@tvvc.org"].includes(credentials.email.trim().toLowerCase())) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email.trim().toLowerCase(),
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        const account = await db.user.findUnique({ where: { id: user.id }, select: { updatedAt: true } });
        token.accountVersion = account?.updatedAt.toISOString();
      }
      if (!token.id) return { id: "", role: "" };
      const account = await db.user.findUnique({ where: { id: token.id }, select: { role: true, updatedAt: true } });
      // A removed account or password reset revokes its existing sessions.
      // Pre-upgrade tokens without a version require a fresh sign-in.
      if (!account || token.accountVersion !== account.updatedAt.toISOString()) return { id: "", role: "" };
      token.role = account.role;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role || "";
        session.user.id = token.id || "";
      }
      return session;
    },
  },
};
