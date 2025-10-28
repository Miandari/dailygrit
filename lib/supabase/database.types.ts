export type Database = {
  public: {
    Tables: {
      challenges: {
        Row: {
          id: string
          name: string
          description: string | null
          starts_at: string
          ends_at: string
          duration_days: number
          created_at: string
          updated_at: string
          creator_id: string
          is_public: boolean
          metrics: any
          failure_mode: string
          lock_entries_after_day: boolean
          invite_code: string | null
          cover_image_url: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          starts_at: string
          ends_at: string
          duration_days: number
          created_at?: string
          updated_at?: string
          creator_id: string
          is_public?: boolean
          metrics?: any
          failure_mode?: string
          lock_entries_after_day?: boolean
          invite_code?: string | null
          cover_image_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          starts_at?: string
          ends_at?: string
          duration_days?: number
          created_at?: string
          updated_at?: string
          creator_id?: string
          is_public?: boolean
          metrics?: any
          failure_mode?: string
          lock_entries_after_day?: boolean
          invite_code?: string | null
          cover_image_url?: string | null
        }
      }
      challenge_participants: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          joined_at: string
          status: string
          current_streak: number
          longest_streak: number
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          joined_at?: string
          status?: string
          current_streak?: number
          longest_streak?: number
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          joined_at?: string
          status?: string
          current_streak?: number
          longest_streak?: number
        }
      }
      daily_entries: {
        Row: {
          id: string
          participant_id: string
          entry_date: string
          metric_data: any
          is_completed: boolean
          is_locked: boolean
          notes: string | null
          submitted_at: string | null
          created_at: string
          updated_at: string
          file_urls: string[] | null
          day_number?: number
          values?: any
        }
        Insert: {
          id?: string
          participant_id: string
          entry_date?: string
          metric_data?: any
          is_completed?: boolean
          is_locked?: boolean
          notes?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
          file_urls?: string[] | null
          day_number?: number
          values?: any
        }
        Update: {
          id?: string
          participant_id?: string
          entry_date?: string
          metric_data?: any
          is_completed?: boolean
          is_locked?: boolean
          notes?: string | null
          submitted_at?: string | null
          created_at?: string
          updated_at?: string
          file_urls?: string[] | null
          day_number?: number
          values?: any
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          full_name: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          full_name?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          full_name?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_challenge_access: {
        Row: {
          user_id: string
          challenge_id: string
          can_view: boolean
          can_edit: boolean
          access_reason: string | null
        }
        Insert: {
          user_id: string
          challenge_id: string
          can_view?: boolean
          can_edit?: boolean
          access_reason?: string | null
        }
        Update: {
          user_id?: string
          challenge_id?: string
          can_view?: boolean
          can_edit?: boolean
          access_reason?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}