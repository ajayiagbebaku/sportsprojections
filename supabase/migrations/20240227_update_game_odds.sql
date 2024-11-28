-- Add team ID columns to game_odds table
alter table game_odds
add column team_id_home text references team_stats(team_code),
add column team_id_away text references team_stats(team_code);

-- Create indexes for team IDs
create index game_odds_team_ids_idx on game_odds(team_id_home, team_id_away);