-- Add unique constraint if it doesn't exist
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