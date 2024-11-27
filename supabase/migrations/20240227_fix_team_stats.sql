-- Drop and recreate team_stats table with correct schema
drop table if exists team_stats;

create table team_stats (
    id bigint generated by default as identity primary key,
    team_name text not null,
    team_code text not null,
    team_id text not null,
    ppg numeric(5,1) not null,
    oppg numeric(5,1) not null,
    pace numeric(5,1) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create unique index team_stats_team_code_idx on team_stats(team_code);
create unique index team_stats_team_id_idx on team_stats(team_id);

-- Insert initial team stats
insert into team_stats (team_name, team_code, team_id, ppg, oppg, pace) values
('Atlanta', 'ATL', '1', 114.9, 119.6, 103.3),
('Boston', 'BOS', '2', 121.5, 111.8, 97.3),
('Brooklyn', 'BKN', '3', 111.7, 114.7, 96.3),
('Charlotte', 'CHA', '4', 110.1, 114.5, 97.7),
('Chicago', 'CHI', '5', 115.4, 122.9, 104.2),
('Cleveland', 'CLE', '6', 123.5, 111.2, 99.8),
('Dallas', 'DAL', '7', 115.6, 109.3, 98.1),
('Denver', 'DEN', '8', 116.5, 115.1, 100.2),
('Detroit', 'DET', '9', 110.4, 111.6, 97.8),
('Golden State', 'GSW', '10', 119.6, 109.1, 101.7),
('Houston', 'HOU', '11', 114.6, 106.2, 100.3),
('Indiana', 'IND', '12', 114.3, 118.4, 99.5),
('LA Clippers', 'LAC', '13', 108.9, 108.1, 97.6),
('LA Lakers', 'LAL', '14', 117.3, 116.2, 99.0),
('Memphis', 'MEM', '15', 118.9, 112.6, 104.1),
('Miami', 'MIA', '16', 110.9, 110.1, 97.2),
('Milwaukee', 'MIL', '17', 111.3, 112.2, 98.6),
('Minnesota', 'MIN', '18', 113.3, 111.0, 98.1),
('New Orleans', 'NOP', '19', 103.5, 115.4, 96.3),
('New York', 'NYK', '20', 118.3, 111.9, 96.0),
('Oklahoma City', 'OKC', '21', 114.3, 103.6, 100.5),
('Orlando', 'ORL', '22', 106.8, 103.2, 97.5),
('Philadelphia', 'PHI', '23', 103.9, 112.6, 96.6),
('Phoenix', 'PHX', '24', 112.1, 114.5, 96.8),
('Portland', 'POR', '25', 106.8, 113.8, 100.3),
('Sacramento', 'SAC', '26', 116.9, 113.7, 98.6),
('San Antonio', 'SAS', '27', 110.1, 110.1, 98.7),
('Toronto', 'TOR', '28', 113.2, 118.6, 98.9),
('Utah', 'UTA', '29', 108.7, 119.3, 99.7),
('Washington', 'WAS', '30', 109.9, 124.7, 103.0);