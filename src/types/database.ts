export type RegistrationType = 'free_no_registration' | 'free_registration' | 'paid'

export interface EventSession {
  title: string | null
  start_time: string | null
  end_time: string | null
  speaker: string | null
}

export interface DaySchedule {
  date: string
  label: string | null        // day theme e.g. "Workers Retreat"
  sessions: EventSession[]
  // legacy fields — kept for backward compat with old records
  start_time?: string
  end_time?: string | null
}

export type AccountType = 'church' | 'organizer'
export type AdminRole = 'super_admin' | 'admin' | 'moderator'
export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user'
export type EventStatus = 'pending' | 'approved' | 'rejected' | 'hidden'
export type EventCategory = string
export type EventLifecycle = 'upcoming' | 'ongoing' | 'ended'
export type ClaimStatus = 'pending' | 'approved' | 'rejected'
export type ProfileType = 'church' | 'organizer'

export interface Profile {
  id: string
  email: string
  account_type: AccountType
  display_name: string
  avatar_url: string | null
  profile_completed: boolean
  state: string | null
  church_name: string | null
  bio: string | null
  website: string | null
  status: string
  is_hidden: boolean
  role: UserRole
  ministry_type: string | null
  created_at: string
  updated_at: string
}

export interface Church {
  id: string
  profile_id: string | null
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
  // Phase 2 additions
  owner_user_id: string | null
  is_claimed: boolean
  created_by_admin: boolean
  source: string
  source_url: string | null
  claim_requested_at: string | null
  claim_requested_by: string | null
  claim_verified_at: string | null
  verified_badge: boolean
  is_hidden: boolean
  denomination: string | null
  pastor_name: string | null
  leader_title: string | null
  founder: string | null
  instagram: string | null
  facebook: string | null
  created_at: string
  updated_at: string
  // joined relations
  profiles?: Profile
  events?: Event[]
}

export interface SeededOrganizer {
  id: string
  name: string
  slug: string
  description: string | null
  contact_person: string | null
  ministry_type: string | null
  city: string
  state: string
  country: string
  address: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  logo_url: string | null
  source: string
  source_url: string | null
  owner_user_id: string | null
  is_claimed: boolean
  is_verified: boolean
  verified_badge: boolean
  created_by_admin: boolean
  claim_requested_at: string | null
  claim_requested_by: string | null
  claim_verified_at: string | null
  is_hidden: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface ClaimRequest {
  id: string
  profile_type: ProfileType
  profile_id: string
  profile_name: string
  claimant_id: string
  claimant_name: string
  claimant_email: string
  claimant_role: string
  claimant_phone: string
  verification_notes: string
  document_url: string | null
  status: ClaimStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
}

export interface Event {
  id: string
  organizer_id: string | null
  church_id: string | null
  seeded_organizer_id: string | null
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
  // Phase 1 additions
  views_count: number
  speakers: string | null
  parking_available: boolean
  child_friendly: boolean
  notes: string | null
  shuttle_available: boolean
  wheelchair_accessible: boolean
  food_provided: boolean
  accommodation_available: boolean
  dress_code: string | null
  no_recording: boolean
  gender_restriction: string | null
  featured_until: string | null
  // New fields
  is_online: boolean
  online_platform: string | null
  online_link: string | null
  price: number | null
  currency: string
  payment_link: string | null
  rsvp_required: boolean
  capacity: number | null
  tags: string[]
  visibility: string
  gallery_urls: string[]
  registration_type: RegistrationType
  // Phase 2 additions
  created_by_admin: boolean
  source_url: string | null
  daily_schedule: DaySchedule[] | null
  timezone: string
  livestream_url: string | null
  // admin fields
  rejection_reason: string | null
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  // joined relations
  profiles?: Profile | null
  churches?: Church | null
  seeded_organizers?: SeededOrganizer | null
  attendances?: Attendance[]
}

export interface Registration {
  id: string
  event_id: string
  full_name: string
  email: string
  ticket_number: number
  registration_type: RegistrationType
  paid_confirmed: boolean
  created_at: string
}

export interface Attendance {
  id: string
  event_id: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  created_at: string
}

export interface Follow {
  id: string
  follower_id: string
  target_id: string
  target_type: 'church' | 'organizer'
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
  created_at: string
}

/** Returns 'upcoming' | 'ongoing' | 'ended' based on event dates.
 *  For multi-day events with daily_schedule, 'ongoing' only fires during an
 *  actual session window today — not during the dead hours between days. */
export function getEventLifecycle(
  startDate: string,
  endDate?: string | null,
  dailySchedule?: DaySchedule[] | null,
): EventLifecycle {
  const now = new Date()
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 5 * 60 * 60 * 1000)

  if (now < start) return 'upcoming'
  if (now > end) return 'ended'

  // Event date range is active. For multi-day scheduled events, check whether
  // we're actually inside a session window right now. If not, show 'upcoming'
  // (next session hasn't started yet today) rather than 'ongoing'.
  if (dailySchedule && dailySchedule.length > 1) {
    const todayStr = now.toISOString().slice(0, 10) // "YYYY-MM-DD"
    const todayDay = dailySchedule.find(d => d.date === todayStr)

    if (!todayDay) {
      // No sessions scheduled for today — we're between days
      return 'upcoming'
    }

    // Check if now falls inside any of today's session windows
    const sessions = todayDay.sessions?.length
      ? todayDay.sessions
      : todayDay.start_time
      ? [{ start_time: todayDay.start_time, end_time: todayDay.end_time ?? null, title: null, speaker: null }]
      : []

    const inSession = sessions.some(s => {
      if (!s.start_time) return false
      // Session times are "HH:MM" — combine with today's date to get full timestamps
      const [sh, sm] = s.start_time.split(':').map(Number)
      const sessionStart = new Date(now)
      sessionStart.setHours(sh, sm, 0, 0)

      if (s.end_time) {
        const [eh, em] = s.end_time.split(':').map(Number)
        const sessionEnd = new Date(now)
        sessionEnd.setHours(eh, em, 0, 0)
        return now >= sessionStart && now <= sessionEnd
      }
      // No end time — treat session as 1 hour long
      return now >= sessionStart && now <= new Date(sessionStart.getTime() + 60 * 60 * 1000)
    })

    return inSession ? 'ongoing' : 'upcoming'
  }

  return 'ongoing'
}

// Supabase Database type shape
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      churches: {
        Row: Church
        Insert: Omit<Church, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'events'>
        Update: Partial<Omit<Church, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'events'>>
      }
      seeded_organizers: {
        Row: SeededOrganizer
        Insert: Omit<SeededOrganizer, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SeededOrganizer, 'id' | 'created_at' | 'updated_at'>>
      }
      claim_requests: {
        Row: ClaimRequest
        Insert: Omit<ClaimRequest, 'id' | 'created_at'>
        Update: Partial<Omit<ClaimRequest, 'id' | 'created_at'>>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'churches' | 'attendances'>
        Update: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'churches' | 'attendances'>>
      }
      attendances: {
        Row: Attendance
        Insert: Omit<Attendance, 'id' | 'created_at'>
        Update: Partial<Omit<Attendance, 'id' | 'created_at'>>
      }
      follows: {
        Row: Follow
        Insert: Omit<Follow, 'id' | 'created_at'>
        Update: never
      }
      admin_users: {
        Row: AdminUser
        Insert: Omit<AdminUser, 'created_at'>
        Update: Partial<Omit<AdminUser, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_event_views: { Args: { p_event_id: string }; Returns: void }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      account_type: AccountType
      admin_role: AdminRole
      event_status: EventStatus
      event_category: EventCategory
    }
  }
}
