import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session.user type to include the user's ID and currency.
   */
  interface Session {
    user: {
      id: string;
      currency: string;
    } & DefaultSession['user'];
  }

  /**
   * Extends the built-in user type.
   */
  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT type to include the user's ID.
   */
  interface JWT {
    id: string;
  }
} 