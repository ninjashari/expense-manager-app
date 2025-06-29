/**
 * @file types.ts
 * @description This file contains shared type definitions.
 * It provides types used across the application.
 */

/**
 * User interface for authentication
 * @description Defines the shape of a user object
 */
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  user_metadata?: {
    full_name?: string
  }
}

/**
 * Session interface
 * @description Defines the shape of a session object
 */
export interface Session {
  user: User
  access_token: string
  expires_at: number
} 