export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: { id: string; name: string; sport: string; season: string; created_at: string }
        Insert: { id?: string; name: string; sport?: string; season?: string; created_at?: string }
        Update: { id?: string; name?: string; sport?: string; season?: string }
      }
      players: {
        Row: { id: string; team_id: string; name: string; number: number | null; role: string | null; is_active: boolean; created_at: string }
        Insert: { id?: string; team_id: string; name: string; number?: number | null; role?: string | null; is_active?: boolean }
        Update: { id?: string; team_id?: string; name?: string; number?: number | null; role?: string | null; is_active?: boolean }
      }
      fine_types: {
        Row: { id: string; team_id: string; label: string; amount: number; category: string; is_active: boolean }
        Insert: { id?: string; team_id: string; label: string; amount: number; category: string; is_active?: boolean }
        Update: { id?: string; label?: string; amount?: number; category?: string; is_active?: boolean }
      }
      fines: {
        Row: { id: string; team_id: string; player_id: string; fine_type_id: string; label: string; amount: number; date: string; month: string; is_paid: boolean; note: string | null; created_at: string }
        Insert: { id?: string; team_id: string; player_id: string; fine_type_id: string; label: string; amount: number; date?: string; month: string; is_paid?: boolean; note?: string | null }
        Update: { is_paid?: boolean; note?: string | null; amount?: number }
      }
    }
  }
}

export type Team = Database['public']['Tables']['teams']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type FineType = Database['public']['Tables']['fine_types']['Row']
export type Fine = Database['public']['Tables']['fines']['Row']
