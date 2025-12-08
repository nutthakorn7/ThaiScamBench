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
          // Mock Login for Demo (Pitching)
          if (
            credentials.email === "demo@thaiscam.zcr.ai" && 
            credentials.password === "demo1234"
          ) {
            return {
              id: "partner_demo_001",
              name: "Demo Partner",
              email: "demo@thaiscam.zcr.ai",
              role: "partner",
              partnerId: "partner_demo",
              accessToken: "mock_partner_token_xyz"
            };
          }

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
            // Return user object with role and token
            return {
              id: data.user_id,
              name: data.name || data.email,
              email: data.email,
              role: data.role, // "admin" or "partner"
              partnerId: data.partner_id,
              accessToken: data.access_token, // CAPTURE TOKEN
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
        // Store role, partnerId, and accessToken in JWT
        token.role = (user as any).role;
        token.partnerId = (user as any).partnerId;
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Make role and partnerId available in session
        (session.user as any).role = token.role as string;
        (session.user as any).partnerId = token.partnerId as string;
        (session.user as any).id = token.id as string;
        (session as any).accessToken = token.accessToken as string; // Pass to session root or user
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
