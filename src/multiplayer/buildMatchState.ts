import { pairInCircle } from '../game/engine'
import type { MatchState, Participant } from '../game/types'
import type { AttemptRow, RoomPlayerRow, RoomRow, RoundStateRow } from './dbTypes'

export function buildMatchState(
  room: RoomRow,
  round: RoundStateRow,
  players: RoomPlayerRow[],
  attempts: AttemptRow[],
  myUserId: string | null,
  mySecret: string | null,
): MatchState {
  const orderedIds = round.turn_order.length > 0 ? round.turn_order : players.map((p) => p.id)
  const targets = pairInCircle(orderedIds)
  const byId = new Map(players.map((p) => [p.id, p]))

  const participants: Participant[] = orderedIds
    .filter((id) => byId.has(id))
    .map((id) => {
      const row = byId.get(id)!
      const mine = row.user_id === myUserId
      const myAttempts = attempts
        .filter((a) => a.guesser_id === id && a.round_number === round.round_number && a.graded)
        .sort((a, b) => a.turn_number - b.turn_number)
        .map((a) => ({
          turnNumber: a.turn_number,
          guesserId: a.guesser_id,
          guess: a.guess,
          feedback: { exact: a.exact ?? 0, misplaced: a.misplaced ?? 0 },
        }))

      return {
        id,
        name: row.name,
        isCpu: false,
        targetId: targets[id],
        secret: mine ? mySecret ?? '' : '',
        attempts: myAttempts,
        roundWins: row.round_wins,
        wonRound: round.winners.includes(id),
        extraShotUsed: false,
        hadTurnThisRound: false,
      }
    })

  return {
    mode: room.mode,
    participants,
    round: {
      roundNumber: round.round_number,
      phase: round.phase,
      turnOrder: orderedIds,
      starterId: round.starter_id ?? orderedIds[0],
      currentTurnIndex: round.current_turn_index,
      winners: round.winners,
      extraShotQueue: round.extra_shot_queue,
      pendingAttempt: round.pending_attempt,
    },
    matchWinnerId: round.match_winner_id,
    winTarget: room.win_target,
  }
}
