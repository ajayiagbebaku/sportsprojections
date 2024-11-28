import axios from 'axios';
import { format, addDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';
const RAPIDAPI_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const RAPIDAPI_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Team code mapping to ensure consistency
const teamCodeMapping = {
  'ATL': 'ATL',
  'BOS': 'BOS',
  'BKN': 'BKN',
  'BRK': 'BKN',
  'CHA': 'CHA',
  'CHI': 'CHI',
  'CLE': 'CLE',
  'DAL': 'DAL',
  'DEN': 'DEN',
  'DET': 'DET',
  'GSW': 'GSW',
  'GS': 'GSW',
  'HOU': 'HOU',
  'IND': 'IND',
  'LAC': 'LAC',
  'LAL': 'LAL',
  'MEM': 'MEM',
  'MIA': 'MIA',
  'MIL': 'MIL',
  'MIN': 'MIN',
  'NOP': 'NOP',
  'NO': 'NOP',
  'NYK': 'NYK',
  'NY': 'NYK',
  'OKC': 'OKC',
  'ORL': 'ORL',
  'PHI': 'PHI',
  'PHX': 'PHX',
  'POR': 'POR',
  'SAC': 'SAC',
  'SAS': 'SAS',
  'SA': 'SAS',
  'TOR': 'TOR',
  'UTA': 'UTA',
  'WAS': 'WAS'
};

async function fetchScheduleForDate(date) {
  try {
    const formattedDate = format(date, 'yyyyMMdd');
    console.log(`Fetching schedule for ${formattedDate}`);

    const response = await axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBAGamesForDate', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      params: { gameDate: formattedDate }
    });

    if (!response.data?.body || !Array.isArray(response.data.body)) {
      console.log(`No games found for ${formattedDate}`);
      return [];
    }

    const games = [];
    for (const game of response.data.body) {
      const homeCode = teamCodeMapping[game.home];
      const awayCode = teamCodeMapping[game.away];

      if (!homeCode || !awayCode) {
        console.warn(`Invalid team code mapping for game: ${game.home} vs ${game.away}`);
        continue;
      }

      games.push({
        game_id: game.gameID,
        game_date: format(date, 'yyyy-MM-dd'),
        home_team: game.home,
        away_team: game.away,
        team_id_home: homeCode,
        team_id_away: awayCode
      });
    }

    if (games.length > 0) {
      const { error } = await supabase
        .from('nba_schedule')
        .upsert(games, {
          onConflict: 'game_id',
          returning: 'minimal'
        });

      if (error) {
        console.error(`Error saving games for ${formattedDate}:`, error);
      } else {
        console.log(`Saved ${games.length} games for ${formattedDate}`);
      }
    }

    return games;
  } catch (error) {
    console.error(`Error fetching schedule for ${format(date, 'yyyy-MM-dd')}:`, error);
    return [];
  }
}

async function fetchScheduleForDateRange(startDate, endDate) {
  try {
    // Clear existing schedule for the date range
    const { error: clearError } = await supabase
      .from('nba_schedule')
      .delete()
      .gte('game_date', format(startDate, 'yyyy-MM-dd'))
      .lte('game_date', format(endDate, 'yyyy-MM-dd'));

    if (clearError) {
      console.error('Error clearing existing schedule:', clearError);
      return;
    }

    console.log('Starting to fetch NBA schedule...');
    console.log(`Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    let currentDate = startDate;
    let totalGames = 0;

    while (currentDate <= endDate) {
      const games = await fetchScheduleForDate(currentDate);
      totalGames += games.length;

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentDate = addDays(currentDate, 1);
    }

    console.log(`Finished fetching schedule. Total games: ${totalGames}`);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

// Run the fetcher for October-December 2024
const startDate = new Date('2024-10-01');
const endDate = new Date('2024-12-31');

fetchScheduleForDateRange(startDate, endDate)
  .then(() => {
    console.log('Schedule fetch completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schedule fetch failed:', error);
    process.exit(1);
  });