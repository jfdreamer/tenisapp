export interface Player {
  id: string
  email: string
  first_name: string
  last_name: string
  ranking_position: number
  created_at: string
  updated_at: string
  is_admin?: boolean
}

export interface Challenge {
  id: string
  challenger_id: string
  challenged_id: string
  challenge_date: string
  challenge_time: string
  status: "pending" | "accepted" | "completed" | "cancelled" | "declined"
  winner_id?: string
  score?: string
  created_at: string
  updated_at: string
  challenger?: {
    first_name: string
    last_name: string
    ranking_position: number
  }
  challenged?: {
    first_name: string
    last_name: string
    ranking_position: number
  }
  winner?: {
    first_name: string
    last_name: string
  }
}

export interface Availability {
  id: string
  player_id: string
  day_of_week: number // 0-6 (Sunday-Saturday)
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}
