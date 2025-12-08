import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.thaiscam.zcr.ai/v1";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call backend auth API
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            // Return user object with role
            return {
              id: data.user_id,
              name: data.name || data.email,
              email: data.email,
              role: data.role, // "admin" or "partner"
              partnerId: data.partner_id,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Store role and partnerId in JWT
        token.role = (user as { role?: string }).role;
        token.partnerId = (user as { partnerId?: string }).partnerId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Make role and partnerId available in session
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { partnerId?: string }).partnerId = token.partnerId as string;
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "super_secret_dev_key_change_me",
});

export { handler as GET, handler as POST };
