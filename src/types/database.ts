export type AccountType = 'church' | 'organizer'
export type AdminRole = 'super_admin' | 'admin' | 'moderator'
export type EventStatus = 'pending' | 'approved' | 'rejected'
export type EventCategory = 'worship' | 'prayer' | 'conference' | 'youth' | 'training' | 'other'

export interface Profile {
  id: string
  email: string
  account_type: AccountType
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Church {
  id: string
  profile_id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string
  state: string
  country: string
  service_times: string | null
  logo_url: string | null
  banner_url: string | null
  website_url: string | null
  phone: string | null
  is_featured: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
  // joined relations
  profiles?: Profile
  events?: Event[]
}

export interface Event {
  id: string
  organizer_id: string
  church_id: string | null
  title: string
  slug: string
  description: string
  category: EventCategory
  status: EventStatus
  banner_url: string | null
  start_date: string
  end_date: string | null
  location_name: string
  address: string | null
  city: string
  state: string
  country: string
  external_link: string | null
  is_featured: boolean
  is_free: boolean
  rejection_reason: string | null
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  // joined relations
  profiles?: Profile
  churches?: Church | null
}

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  created_at: string
}

// Supabase Database type shape
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: {
          id?: string
          email?: string
          account_type?: AccountType
          display_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
      }
      churches: {
        Row: Church
        Insert: Omit<Church, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'events'>
        Update: {
          profile_id?: string
          name?: string
          slug?: string
          description?: string | null
          address?: string | null
          city?: string
          state?: string
          country?: string
          service_times?: string | null
          logo_url?: string | null
          banner_url?: string | null
          website_url?: string | null
          phone?: string | null
          is_featured?: boolean
          is_verified?: boolean
          updated_at?: string
        }
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'churches'>
        Update: {
          organizer_id?: string
          church_id?: string | null
          title?: string
          slug?: string
          description?: string
          category?: EventCategory
          status?: EventStatus
          banner_url?: string | null
          start_date?: string
          end_date?: string | null
          location_name?: string
          address?: string | null
          city?: string
          state?: string
          country?: string
          external_link?: string | null
          is_featured?: boolean
          is_free?: boolean
          rejection_reason?: string | null
          approved_at?: string | null
          approved_by?: string | null
          updated_at?: string
        }
      }
      admin_users: {
        Row: AdminUser
        Insert: Omit<AdminUser, 'created_at'>
        Update: {
          email?: string
          role?: AdminRole
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      account_type: AccountType
      admin_role: AdminRole
      event_status: EventStatus
      event_category: EventCategory
    }
  }
}
