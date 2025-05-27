export interface Player {
  id: string
  email: string
  first_name: string
  last_name: string
  ranking_position: number
  created_at: string
  updated_at: string
}

export interface Availability {
  id: string
  player_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface Challenge {
  id: string
  challenger_id: string
  challenged_id: string
  challenge_date: string
  challenge_time: string
  status: "pending" | "accepted" | "rejected" | "completed" | "no_show" | "postponed_rain"
  winner_id?: string
  created_at: string
  completed_at?: string
  postponed_reason?: string
  original_date?: string
  challenger?: Player
  challenged?: Player
  winner?: Player
}

export interface RankingHistory {
  id: string
  player_id: string
  old_position: number
  new_position: number
  change_reason: string
  challenge_id?: string
  created_at: string
}
