import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import pool from './db';

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing required Google OAuth environment variables');
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev',
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered:', { user: user?.email, provider: account?.provider });
      
      if (account?.provider === 'google') {
        try {
          const client = await pool.connect();
          
          // Create users table if it doesn't exist
          await client.query(`
            CREATE TABLE IF NOT EXISTS users (
              id SERIAL PRIMARY KEY,
              email VARCHAR(255) UNIQUE NOT NULL,
              name VARCHAR(255),
              image VARCHAR(255),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Check if user exists
          const existingUser = await client.query(
            'SELECT * FROM users WHERE email = $1',
            [user.email]
          );
          
          if (existingUser.rows.length === 0) {
            // Create new user
            await client.query(
              'INSERT INTO users (email, name, image) VALUES ($1, $2, $3)',
              [user.email, user.name, user.image]
            );
            console.log('New user created:', user.email);
          } else {
            console.log('Existing user signed in:', user.email);
          }
          
          client.release();
          return true;
        } catch (error) {
          console.error('Error saving user:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const client = await pool.connect();
          const result = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [session.user.email]
          );
          client.release();
          
          if (result.rows.length > 0) {
            session.user.id = result.rows[0].id;
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      }
      return session;
    },
  },
};