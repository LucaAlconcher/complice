import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  currentTurnParticipantId,
  forfeitTurn as forfeitTurnEngine,
  gradeAttempt as gradeAttemptEngine,
  startNextRound as startNextRoundEngine,
} from '../game/engine'
import type { GameMode } from '../game/types'
import { buildMatchState } from './buildMatchState'
import { generateRoomCode } from './roomCode'
import type { AttemptRow, RoomPlayerRow, RoomRow, RoundStateRow } from './dbTypes'

function upsertById<T extends { id: string }>(list: T[], eventType: string, newRow: T | null, oldRow: T | null): T[] {
  if (eventType === 'DELETE') return list.filter((x) => x.id !== oldRow?.id)
  if (!newRow) return list
  const idx = list.findIndex((x) => x.id === newRow.id)
  if (idx === -1) return [...list, newRow]
  const copy = [...list]
  copy[idx] = newRow
  return copy
}

// Module-level singleton so signInAnonymously() fires exactly once per page load, even
// though React 18 StrictMode double-invokes effects in dev (two concurrent sign-ins would
// otherwise race: whichever resolves last becomes the client's active session, which can
// end up out of sync with whichever call's result got stored in component state).
let anonymousAuthPromise: Promise<string | null> | null = null

function ensureAnonymousAuth(): Promise<string | null> {
  if (!anonymousAuthPromise) {
    anonymousAuthPromise = (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) return sessionData.session.user.id
      const { data, error: signInError } = await supabase.auth.signInAnonymously()
      if (signInError) throw signInError
      return data.user?.id ?? null
    })()
  }
  return anonymousAuthPromise
}

export function useRoom() {
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [room, setRoom] = useState<RoomRow | null>(null)
  const [players, setPlayers] = useState<RoomPlayerRow[]>([])
  const [roundRow, setRoundRow] = useState<RoundStateRow | null>(null)
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [mySecretValue, setMySecretState] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Anonymous session: gives every browser tab a stable uid without asking for a login.
  useEffect(() => {
    let mounted = true
    ensureAnonymousAuth()
      .then((uid) => {
        if (mounted) setMyUserId(uid)
      })
      .catch((signInError: Error) => {
        if (mounted) setError(`No se pudo conectar: ${signInError.message}`)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Initial load + realtime subscription for everything tied to this room.
  useEffect(() => {
    if (!roomId) return
    let cancelled = false

    const fetchAll = async () => {
      const [roomRes, playersRes, roundRes, attemptsRes] = await Promise.all([
        supabase.from('rooms').select('*').eq('id', roomId).single(),
        supabase.from('room_players').select('*').eq('room_id', roomId).order('joined_at'),
        supabase.from('round_state').select('*').eq('room_id', roomId).maybeSingle(),
        supabase.from('attempts').select('*').eq('room_id', roomId).order('turn_number'),
      ])
      if (cancelled) return
      if (roomRes.data) setRoom(roomRes.data as RoomRow)
      if (playersRes.data) setPlayers(playersRes.data as RoomPlayerRow[])
      if (roundRes.data) setRoundRow(roundRes.data as RoundStateRow)
      if (attemptsRes.data) setAttempts(attemptsRes.data as AttemptRow[])
    }

    fetchAll()

    // Realtime can silently miss updates (mobile tab backgrounded/throttled, brief disconnects),
    // so poll as a fallback and force a refetch whenever the tab regains focus/visibility.
    const pollInterval = setInterval(fetchAll, 4000)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchAll()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', onVisibilityChange)

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return
          setRoom(payload.new as RoomRow)
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setPlayers((prev) =>
            upsertById(prev, payload.eventType, payload.new as RoomPlayerRow, payload.old as RoomPlayerRow),
          )
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'round_state', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return
          setRoundRow(payload.new as RoundStateRow)
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attempts', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setAttempts((prev) =>
            upsertById(prev, payload.eventType, payload.new as AttemptRow, payload.old as AttemptRow),
          )
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      clearInterval(pollInterval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', onVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, [roomId])

  // Fetch (only I can read) my own secret for the current round.
  useEffect(() => {
    if (!roomId || !myPlayerId || !roundRow) {
      setMySecretState(null)
      return
    }
    let cancelled = false
    supabase
      .from('secrets')
      .select('secret')
      .eq('room_id', roomId)
      .eq('round_number', roundRow.round_number)
      .eq('player_id', myPlayerId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setMySecretState(data?.secret ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [roomId, myPlayerId, roundRow?.round_number])

  // Once every player has submitted their secret for this round, flip to 'playing'.
  useEffect(() => {
    if (!roomId || !roundRow || roundRow.phase !== 'setting-secrets') return
    if (players.length < 2) return
    const allReady = players.every((p) => p.secret_ready_round === roundRow.round_number)
    if (allReady) {
      supabase
        .from('round_state')
        .update({ phase: 'playing', current_turn_index: 0 })
        .eq('room_id', roomId)
        .then(({ error: updateError }) => {
          if (updateError) console.error('Failed to advance round to playing:', updateError)
        })
    }
  }, [players, roundRow, roomId])

  const match = useMemo(() => {
    if (!room || !roundRow) return null
    return buildMatchState(room, roundRow, players, attempts, myUserId, mySecretValue)
  }, [room, roundRow, players, attempts, myUserId, mySecretValue])

  const myPlayer = players.find((p) => p.id === myPlayerId) ?? null
  const isHost = myPlayer?.is_host ?? false

  async function createRoom(name: string, mode: GameMode) {
    if (!myUserId) throw new Error('Todavia estamos conectando, esperá un segundo.')
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode()
      const { data, error: insertError } = await supabase
        .from('rooms')
        .insert({ code, mode })
        .select()
        .single()
      if (!insertError && data) {
        const { data: player, error: playerError } = await supabase
          .from('room_players')
          .insert({ room_id: data.id, user_id: myUserId, name, is_host: true })
          .select()
          .single()
        if (playerError) throw playerError
        setRoomId(data.id)
        setMyPlayerId(player.id)
        return data.code as string
      }
      if (insertError && !insertError.message.includes('duplicate')) throw insertError
    }
    throw new Error('No se pudo crear la sala, intenta de nuevo.')
  }

  async function joinRoom(code: string, name: string) {
    if (!myUserId) throw new Error('Todavia estamos conectando, esperá un segundo.')
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle()
    if (roomError) throw roomError
    if (!roomData) throw new Error('No encontramos esa sala. Revisa el codigo.')
    if (roomData.status !== 'lobby') throw new Error('Esa partida ya empezo.')

    const { data: player, error: playerError } = await supabase
      .from('room_players')
      .insert({ room_id: roomData.id, user_id: myUserId, name, is_host: false })
      .select()
      .single()
    if (playerError) throw playerError
    setRoomId(roomData.id)
    setMyPlayerId(player.id)
  }

  async function startGame() {
    if (!room) return
    const ordered = [...players].sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    const ids = ordered.map((p) => p.id)
    await Promise.all(ordered.map((p, i) => supabase.from('room_players').update({ position: i }).eq('id', p.id)))
    await supabase.from('rooms').update({ status: 'playing' }).eq('id', room.id)
    await supabase.from('round_state').insert({
      room_id: room.id,
      round_number: 1,
      phase: 'setting-secrets',
      turn_order: ids,
      starter_id: ids[0],
      current_turn_index: 0,
      winners: [],
      extra_shot_queue: [],
      pending_attempt: null,
      match_winner_id: null,
    })
  }

  async function setMySecret(secret: string) {
    if (!roomId || !myPlayerId || !myUserId || !roundRow) return
    const normalized = secret.toUpperCase()
    await supabase.from('secrets').insert({
      room_id: roomId,
      round_number: roundRow.round_number,
      player_id: myPlayerId,
      owner_user_id: myUserId,
      secret: normalized,
    })
    await supabase.from('room_players').update({ secret_ready_round: roundRow.round_number }).eq('id', myPlayerId)
    setMySecretState(normalized)
  }

  async function submitGuess(guess: string) {
    if (!roomId || !roundRow || !myPlayerId) return
    const turnNumber =
      attempts.filter((a) => a.guesser_id === myPlayerId && a.round_number === roundRow.round_number).length + 1
    const normalized = guess.toUpperCase()
    await supabase.from('attempts').insert({
      room_id: roomId,
      round_number: roundRow.round_number,
      turn_number: turnNumber,
      guesser_id: myPlayerId,
      guess: normalized,
      graded: false,
    })
    await supabase
      .from('round_state')
      .update({ pending_attempt: { guesserId: myPlayerId, guess: normalized } })
      .eq('room_id', roomId)
  }

  async function gradeAttempt(exact: number, misplaced: number) {
    if (!roomId || !room || !roundRow || !match) return
    const pending = roundRow.pending_attempt
    if (!pending) return

    const outcome = gradeAttemptEngine(match, { exact, misplaced })

    const attemptRow = attempts.find(
      (a) => a.guesser_id === pending.guesserId && a.round_number === roundRow.round_number && !a.graded,
    )
    if (attemptRow) {
      await supabase.from('attempts').update({ exact, misplaced, graded: true }).eq('id', attemptRow.id)
    }

    await supabase
      .from('round_state')
      .update({
        phase: outcome.match.round.phase,
        current_turn_index: outcome.match.round.currentTurnIndex,
        winners: outcome.match.round.winners,
        extra_shot_queue: outcome.match.round.extraShotQueue,
        pending_attempt: null,
        match_winner_id: outcome.match.matchWinnerId,
      })
      .eq('room_id', roomId)

    for (const winnerId of outcome.match.round.winners) {
      const p = outcome.match.participants.find((x) => x.id === winnerId)
      if (p) await supabase.from('room_players').update({ round_wins: p.roundWins }).eq('id', winnerId)
    }
  }

  async function forfeitMyTurn() {
    if (!roomId || !roundRow || !myPlayerId || !match) return
    if (currentTurnParticipantId(match) !== myPlayerId) return
    if (match.round.pendingAttempt) return
    const next = forfeitTurnEngine(match, myPlayerId)
    await supabase
      .from('round_state')
      .update({
        phase: next.round.phase,
        current_turn_index: next.round.currentTurnIndex,
        extra_shot_queue: next.round.extraShotQueue,
        pending_attempt: next.round.pendingAttempt,
        match_winner_id: next.matchWinnerId,
        winners: next.round.winners,
      })
      .eq('room_id', roomId)
  }

  async function nextRound() {
    if (!roomId || !match) return
    const next = startNextRoundEngine(match)
    await supabase
      .from('round_state')
      .update({
        round_number: next.round.roundNumber,
        phase: next.round.phase,
        turn_order: next.round.turnOrder,
        starter_id: next.round.starterId,
        current_turn_index: next.round.currentTurnIndex,
        winners: next.round.winners,
        extra_shot_queue: next.round.extraShotQueue,
        pending_attempt: null,
      })
      .eq('room_id', roomId)
    setMySecretState(null)
  }

  return {
    myUserId,
    myPlayerId,
    myPlayer,
    isHost,
    room,
    players,
    roundRow,
    match,
    mySecret: mySecretValue,
    error,
    setError,
    createRoom,
    joinRoom,
    startGame,
    setMySecret,
    submitGuess,
    gradeAttempt,
    forfeitMyTurn,
    nextRound,
  }
}
