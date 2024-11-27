-- Create schedule table
create table if not exists nba_schedule (
    id bigint generated by default as identity primary key,
    game_id text not null,
    game_date text not null,
    home_team text not null,
    away_team text not null,
    team_id_home text,
    team_id_away text,
    game_time text,
    arena text,
    city text,
    state text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists nba_schedule_game_date_idx on nba_schedule(game_date);
create index if not exists nba_schedule_teams_idx on nba_schedule(home_team, away_team);

-- Add unique constraint using DO block
do $$ 
begin
    if not exists (
        select 1 from pg_constraint 
        where conname = 'nba_schedule_game_id_unique'
    ) then
        alter table nba_schedule
        add constraint nba_schedule_game_id_unique unique (game_id);
    end if;
end $$;