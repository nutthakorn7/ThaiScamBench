import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Admin Access",
      credentials: {
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // In real app, check DB. Here check ENV or default.
        const validPassword = process.env.ADMIN_PASSWORD || "admin123"; // Default for now
        
        if (credentials?.password === validPassword) {
          return { 
            id: "1", 
            name: "Admin User", 
            email: "admin@thaiscam.zcr.ai",
            accessToken: "thaiscam2024" // The shared secret for backend
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).accessToken = token.accessToken;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "super_secret_dev_key_change_me",
});

export { handler as GET, handler as POST };
