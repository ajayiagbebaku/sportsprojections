-- Add team_id column to team_stats table
alter table team_stats
add column if not exists team_id text;

-- Update team_id values based on team_code
update team_stats
set team_id = case team_code
  when 'ATL' then '1'
  when 'BOS' then '2'
  when 'BKN' then '3'
  when 'CHA' then '4'
  when 'CHI' then '5'
  when 'CLE' then '6'
  when 'DAL' then '7'
  when 'DEN' then '8'
  when 'DET' then '9'
  when 'GSW' then '10'
  when 'HOU' then '11'
  when 'IND' then '12'
  when 'LAC' then '13'
  when 'LAL' then '14'
  when 'MEM' then '15'
  when 'MIA' then '16'
  when 'MIL' then '17'
  when 'MIN' then '18'
  when 'NOP' then '19'
  when 'NYK' then '20'
  when 'OKC' then '21'
  when 'ORL' then '22'
  when 'PHI' then '23'
  when 'PHX' then '24'
  when 'POR' then '25'
  when 'SAC' then '26'
  when 'SAS' then '27'
  when 'TOR' then '28'
  when 'UTA' then '29'
  when 'WAS' then '30'
end;

-- Make team_id not null and create index
alter table team_stats
alter column team_id set not null;

create index if not exists team_stats_team_id_idx on team_stats(team_id);