-- Complice - schema multijugador
-- Ejecutar completo en el SQL Editor de tu proyecto Supabase.
-- Requiere: Authentication > Providers > Anonymous sign-ins habilitado.

create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  mode text not null check (mode in ('word','number')),
  status text not null default 'lobby' check (status in ('lobby','playing','finished')),
  win_target int not null default 3,
  created_at timestamptz not null default now()
);

create table if not exists room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  is_host boolean not null default false,
  position int,
  round_wins int not null default 0,
  secret_ready_round int not null default 0,
  joined_at timestamptz not null default now(),
  unique(room_id, user_id)
);

create table if not exists round_state (
  room_id uuid primary key references rooms(id) on delete cascade,
  round_number int not null default 1,
  phase text not null default 'setting-secrets',
  turn_order jsonb not null default '[]',
  starter_id uuid,
  current_turn_index int not null default 0,
  winners jsonb not null default '[]',
  extra_shot_queue jsonb not null default '[]',
  pending_attempt jsonb,
  match_winner_id uuid,
  updated_at timestamptz not null default now()
);

create table if not exists secrets (
  room_id uuid not null references rooms(id) on delete cascade,
  round_number int not null,
  player_id uuid not null references room_players(id) on delete cascade,
  owner_user_id uuid not null,
  secret text not null,
  primary key (room_id, round_number, player_id)
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  round_number int not null,
  turn_number int not null,
  guesser_id uuid not null references room_players(id) on delete cascade,
  guess text not null,
  exact int,
  misplaced int,
  graded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table rooms enable row level security;
alter table room_players enable row level security;
alter table round_state enable row level security;
alter table secrets enable row level security;
alter table attempts enable row level security;

-- rooms: publicas para lectura, cualquier usuario (anonimo) autenticado puede crear/actualizar
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (auth.role() = 'authenticated');
create policy "rooms_update" on rooms for update using (auth.role() = 'authenticated');

-- room_players: todos ven la lista de jugadores; cada uno solo puede crear/editar su propia fila
create policy "room_players_select" on room_players for select using (true);
create policy "room_players_insert" on room_players for insert with check (user_id = auth.uid());
create policy "room_players_update" on room_players for update using (auth.role() = 'authenticated');

-- round_state: publico para lectura (todos necesitan saber de quien es el turno); escritura para cualquier autenticado (juego basado en confianza, como el papel)
create policy "round_state_select" on round_state for select using (true);
create policy "round_state_insert" on round_state for insert with check (auth.role() = 'authenticated');
create policy "round_state_update" on round_state for update using (auth.role() = 'authenticated');

-- secrets: SOLO el dueno puede leer o insertar su propio secreto
create policy "secrets_select_own" on secrets for select using (owner_user_id = auth.uid());
create policy "secrets_insert_own" on secrets for insert with check (owner_user_id = auth.uid());

-- attempts: publicos (historial visible para todos en la sala); graduar/crear requiere estar autenticado
create policy "attempts_select" on attempts for select using (true);
create policy "attempts_insert" on attempts for insert with check (auth.role() = 'authenticated');
create policy "attempts_update" on attempts for update using (auth.role() = 'authenticated');

-- Realtime: sincroniza estos cambios entre todos los clientes conectados a la sala
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_players;
alter publication supabase_realtime add table round_state;
alter publication supabase_realtime add table attempts;
