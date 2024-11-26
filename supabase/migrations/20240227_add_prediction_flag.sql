-- Add prediction_generated flag to game_scores table
alter table game_scores 
add column if not exists prediction_generated boolean default false;