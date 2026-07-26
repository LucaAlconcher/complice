import type { GameMode, RoundPhase } from '../game/types'

export interface RoomRow {
  id: string
  code: string
  mode: GameMode
  status: 'lobby' | 'playing' | 'finished'
  win_target: number
  created_at: string
}

export interface RoomPlayerRow {
  id: string
  room_id: string
  user_id: string
  name: string
  is_host: boolean
  position: number | null
  round_wins: number
  secret_ready_round: number
  joined_at: string
}

export interface RoundStateRow {
  room_id: string
  round_number: number
  phase: RoundPhase
  turn_order: string[]
  starter_id: string | null
  current_turn_index: number
  winners: string[]
  extra_shot_queue: string[]
  pending_attempt: { guesserId: string; guess: string } | null
  match_winner_id: string | null
  updated_at: string
}

export interface AttemptRow {
  id: string
  room_id: string
  round_number: number
  turn_number: number
  guesser_id: string
  guess: string
  exact: number | null
  misplaced: number | null
  graded: boolean
  created_at: string
}
