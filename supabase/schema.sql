-- Chel 84-0 leaderboard. Paste this whole file into Supabase > SQL Editor and press Run. Safe to run again.
-- Only the site's server functions (using the secret service key) can read or write these tables.
-- Row Level Security is on with no policies, so the public "anon" key cannot touch them.

-- One row per device, per day, per mode. A new season replaces the row (latest season counts, even if worse).
create table if not exists board (
  day        int         not null,            -- 20261011, the Eastern-time day
  mode       text        not null check (mode in ('classic', 'iq')),
  device     text        not null,            -- anonymous id stored in the player's browser
  name       text,                            -- null until they choose a display name (then they appear on the board)
  wins       int         not null check (wins between 0 and 84),
  losses     int         not null,
  rating     numeric(5,2) not null,           -- recomputed on the server, never trusted from the browser
  lineup     jsonb       not null,            -- slot -> { id, name, team }
  top_pick   text,
  hidden     boolean     not null default false,  -- set true to remove a name for everyone (moderation)
  updated_at timestamptz not null default now(),
  primary key (day, mode, device)
);
create index if not exists board_rank_idx on board (day, mode, wins desc, rating desc);

-- Every finished season, all modes, never replaced. Feeds the ticker and the all-time 84-0 Club.
create table if not exists season_log (
  id         bigint generated always as identity primary key,
  day        int         not null,
  mode       text        not null check (mode in ('classic', 'iq', 'cap')),
  device     text        not null,
  name       text,
  wins       int         not null,
  rating     numeric(5,2),
  perfect    boolean     not null default false,
  cup_won    boolean,                         -- Cap Cup only
  players    text[]      not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists season_log_day_idx on season_log (day);
create index if not exists season_log_perfect_idx on season_log (perfect) where perfect;

-- Name reports from the leaderboard (App Store guideline 1.2). Daniel reviews these within 24 hours.
create table if not exists reports (
  id              bigint generated always as identity primary key,
  day             int  not null,
  mode            text not null,
  reported_device text not null,
  reported_name   text,
  reporter_device text not null,
  status          text not null default 'open' check (status in ('open', 'removed', 'dismissed')),
  created_at      timestamptz not null default now()
);

alter table board      enable row level security;
alter table season_log enable row level security;
alter table reports    enable row level security;

-- Today's numbers for the home-page ticker, in one call.
create or replace function ticker_stats(p_day int)
returns json language sql stable as $$
  select json_build_object(
    'seasons',        (select count(*) from season_log where day = p_day),
    'drafters',       (select count(distinct device) from season_log where day = p_day),
    'perfect_today',  (select count(*) from season_log where day = p_day and perfect),
    'perfect_all',    (select count(*) from season_log where perfect),
    'cups_today',     (select count(*) from season_log where day = p_day and cup_won),
    'best_classic',   (select wins from board where day = p_day and mode = 'classic' and not hidden order by wins desc, rating desc limit 1),
    'best_iq',        (select wins from board where day = p_day and mode = 'iq' and not hidden order by wins desc, rating desc limit 1),
    'most_drafted',   (select json_build_object('name', p, 'count', c) from (
                          select p, count(*) c from season_log, unnest(players) p
                          where day = p_day group by p order by c desc, p limit 1) t)
  );
$$;

-- Where a season lands today: teams strictly ahead of it, and teams on the board. Hidden (removed) rows don't count.
create or replace function board_rank(p_day int, p_mode text, p_wins int, p_rating numeric)
returns json language sql stable as $$
  select json_build_object(
    'better', count(*) filter (where wins > p_wins or (wins = p_wins and rating > p_rating)),
    'total',  count(*)
  ) from board where day = p_day and mode = p_mode and not hidden;
$$;

-- Today's top named teams. Ranks count every team (named or not); teams with the same record and rating share a rank.
-- rid is an opaque row id for reporting, so device ids are never sent to other players.
create or replace function board_top(p_day int, p_mode text, p_limit int)
returns table (rank bigint, rid text, name text, wins int, losses int, rating numeric, top_pick text, lineup jsonb)
language sql stable as $$
  select rank, rid, name, wins, losses, rating, top_pick, lineup from (
    select rank() over (order by wins desc, rating desc) as rank,
           md5(device || ':' || day::text) as rid, name, wins, losses, rating, top_pick, lineup
    from board where day = p_day and mode = p_mode and not hidden
  ) t where name is not null order by rank, name limit p_limit;
$$;

-- Lock the functions to the server key too.
revoke execute on function ticker_stats(int), board_rank(int, text, int, numeric), board_top(int, text, int) from public, anon, authenticated;
grant execute on function ticker_stats(int), board_rank(int, text, int, numeric), board_top(int, text, int) to service_role;
