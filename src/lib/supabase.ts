import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced validation with better error messages
if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. Please check your Netlify environment variables configuration.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your Netlify environment variables configuration.'
  )
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch {
  throw new Error(
    `Invalid VITE_SUPABASE_URL: "${supabaseUrl}" is not a valid URL. Please check your Netlify environment variables configuration.`
  )
}

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string)

// Database types
export type UserRole = 'admin' | 'user' | null

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Setter {
  id: string
  name: string
  email: string
  active: boolean
  created_at: string
}

export interface LeadType {
  id: string
  label: string
  active: boolean
  sort_order: number
}

export interface LeadEntity {
  id: string
  entity_type: 'email' | 'domain'
  email: string | null
  domain: string
  created_at: string
  updated_at: string
}

export interface LeadEvent {
  id: string
  lead_entity_id: string
  lead_type_id: string
  setter_id: string | null
  raw_input: string
  notes: string | null
  source: string
  created_by: string
  created_at: string
}

// Joined types for display
export interface LeadEventWithDetails extends LeadEvent {
  lead_entity: LeadEntity
  lead_type: LeadType
  setter: Setter | null
}
