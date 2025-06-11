import NextAuth from 'next-auth';
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/user.model';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('--- AUTHORIZE FUNCTION CALLED ---');
        await dbConnect();

        if (!credentials) {
          console.log('No credentials provided.');
          return null;
        }
        
        console.log('Credentials received:', { email: credentials.email });

        const user = await User.findOne({ email: credentials.email }).select('+password');

        if (!user) {
          console.log('No user found for email:', credentials.email);
          console.log('-----------------------------------');
          return null;
        }

        console.log('User found:', { id: user._id, email: user.email });

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password || ''
        );

        console.log('Password comparison result:', isPasswordCorrect);

        if (!isPasswordCorrect) {
          console.log('Password comparison failed.');
          console.log('-----------------------------------');
          return null;
        }

        console.log('Password correct. Returning user.');
        console.log('-----------------------------------');

        // Return user object without the password
        const { password, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    }
  },
  pages: {
    signIn: '/sign-in',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 