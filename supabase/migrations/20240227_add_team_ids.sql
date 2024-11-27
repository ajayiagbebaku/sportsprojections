-- Add team ID columns to nba_schedule table
alter table nba_schedule
add column team_id_home text,
add column team_id_away text;