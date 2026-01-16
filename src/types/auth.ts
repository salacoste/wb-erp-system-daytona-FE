/**
 * Authentication-related TypeScript types
 */

export interface User {
  id: string
  email: string
  name?: string
  role: 'Owner' | 'Manager' | 'Analyst' | 'Service'
  cabinet_ids?: string[]
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface RegisterResponse {
  user: User
  token?: string
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  token: string
}

