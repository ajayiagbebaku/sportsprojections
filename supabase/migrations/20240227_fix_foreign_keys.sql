-- Add foreign key constraints to nba_schedule
alter table nba_schedule
add constraint nba_schedule_home_team_id_fkey
foreign key (team_id_home) references team_stats(team_code),
add constraint nba_schedule_away_team_id_fkey
foreign key (team_id_away) references team_stats(team_code);

-- Add foreign key constraints to predictions
alter table predictions
add constraint predictions_home_team_id_fkey
foreign key (team_id_home) references team_stats(team_code),
add constraint predictions_away_team_id_fkey
foreign key (team_id_away) references team_stats(team_code);