/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
import axios from 'axios';

// Remove module augmentation for Session

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    access_token?: string;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'email@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const res = await axios.post(
            `${
              process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
            }/api/auth/login`,
            {
              email: credentials?.email,
              password: credentials?.password,
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
          const { user, access_token } = res.data;
          if (user && access_token) {
            return { ...user, access_token };
          }
          return null;
        } catch (err) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.access_token = (user as { access_token?: string }).access_token;
        // Add user id to token
        token.id = (user as any).id || (user as any).sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.access_token = token.access_token as string;
        session.user.id = (token as any).id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
