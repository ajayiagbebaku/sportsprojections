-- Add team ID columns to predictions table
alter table predictions
add column team_id_home text,
add column team_id_away text;