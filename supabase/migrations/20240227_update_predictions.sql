-- Update predictions table schema
alter table predictions
add column if not exists team_id_home text,
add column if not exists team_id_away text;

-- Add indexes for team IDs if they don't exist
create index if not exists predictions_team_ids_idx 
on predictions(team_id_home, team_id_away);

-- Add unique constraint on game_id using DO block
do $$ 
begin
    if not exists (
        select 1 from pg_constraint 
        where conname = 'predictions_game_id_unique'
    ) then
        alter table predictions
        add constraint predictions_game_id_unique unique (game_id);
    end if;
end $$;