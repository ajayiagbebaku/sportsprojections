import axios from 'axios';
import { format, addDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';
const RAPIDAPI_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const RAPIDAPI_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Team code mapping
const teamCodeMapping = {
  'ATL': 'Atlanta',
  'BOS': 'Boston',
  'BKN': 'Brooklyn',
  'BRK': 'Brooklyn',
  'CHA': 'Charlotte',
  'CHI': 'Chicago',
  'CLE': 'Cleveland',
  'DAL': 'Dallas',
  'DEN': 'Denver',
  'DET': 'Detroit',
  'GSW': 'Golden State',
  'GS': 'Golden State',
  'HOU': 'Houston',
  'IND': 'Indiana',
  'LAC': 'LA Clippers',
  'LAL': 'LA Lakers',
  'MEM': 'Memphis',
  'MIA': 'Miami',
  'MIL': 'Milwaukee',
  'MIN': 'Minnesota',
  'NOP': 'New Orleans',
  'NO': 'New Orleans',
  'NYK': 'New York',
  'NY': 'New York',
  'OKC': 'Oklahoma City',
  'ORL': 'Orlando',
  'PHI': 'Philadelphia',
  'PHX': 'Phoenix',
  'POR': 'Portland',
  'SAC': 'Sacramento',
  'SAS': 'San Antonio',
  'SA': 'San Antonio',
  'TOR': 'Toronto',
  'UTA': 'Utah',
  'WAS': 'Washington'
};

async function fetchScheduleAndOdds(date) {
  const formattedDate = format(date, 'yyyyMMdd');
  console.log(`Fetching schedule and odds for ${formattedDate}`);

  try {
    // Fetch both schedule and odds in parallel
    const [scheduleResponse, oddsResponse] = await Promise.all([
      axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBAGamesForDate', {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        params: { gameDate: formattedDate }
      }),
      axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBABettingOdds', {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        params: {
          gameDate: formattedDate,
          itemFormat: 'list'
        }
      })
    ]);

    if (!scheduleResponse.data?.body || !Array.isArray(scheduleResponse.data.body)) {
      console.log(`No valid games data found for ${formattedDate}`);
      return [];
    }

    const games = [];
    const odds = oddsResponse.data?.body || {};

    for (const game of scheduleResponse.data.body) {
      // Validate required game data
      if (!game?.gameID || !game?.home || !game?.away || !game?.teamIDHome || !game?.teamIDAway) {
        console.warn(`Invalid game data:`, game);
        continue;
      }

      const homeTeam = teamCodeMapping[game.home];
      const awayTeam = teamCodeMapping[game.away];

      // Skip games where team mapping is not found
      if (!homeTeam || !awayTeam) {
        console.warn(`Unknown team codes: home=${game.home}, away=${game.away}`);
        continue;
      }

      // Get odds for this game
      const gameOdds = odds[game.gameID];
      const fanduelOdds = gameOdds?.sportsBooks?.find(book => 
        book.sportsBook.toLowerCase() === 'fanduel'
      )?.odds;

      // Save game schedule
      const gameRecord = {
        game_id: game.gameID,
        game_date: format(date, 'yyyy-MM-dd'),
        home_team: homeTeam,
        away_team: awayTeam,
        team_id_home: game.teamIDHome,
        team_id_away: game.teamIDAway
      };

      games.push(gameRecord);

      // Save odds if available
      if (fanduelOdds) {
        const oddsRecord = {
          game_id: game.gameID,
          game_date: format(date, 'yyyy-MM-dd'),
          spread_home: parseFloat(fanduelOdds.homeTeamSpread),
          total: parseFloat(fanduelOdds.totalOver),
          home_moneyline: parseInt(fanduelOdds.homeTeamMLOdds),
          away_moneyline: parseInt(fanduelOdds.awayTeamMLOdds)
        };

        // Save odds to database
        const { error: oddsError } = await supabase
          .from('game_odds')
          .upsert(oddsRecord, {
            onConflict: 'game_id',
            returning: 'minimal'
          });

        if (oddsError) {
          console.error(`Error saving odds for game ${game.gameID}:`, oddsError);
        }
      }
    }

    console.log(`Found ${games.length} valid games for ${formattedDate}`);
    return games;
  } catch (error) {
    console.error(`Error fetching data for ${formattedDate}:`, error.message);
    if (error.response) {
      console.error('API Error Response:', error.response.data);
    }
    return [];
  }
}

async function fetchEntireSeason() {
  try {
    // Define season date range
    const startDate = new Date('2024-10-15');
    const endDate = new Date('2025-04-17');
    let currentDate = startDate;
    
    console.log('Starting to fetch entire NBA season schedule...');
    console.log(`Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);

    // First, clear existing schedule
    const { error: clearError } = await supabase
      .from('nba_schedule')
      .delete()
      .neq('id', 0);

    if (clearError) {
      console.error('Error clearing existing schedule:', clearError);
      return;
    }

    // Clear existing odds
    const { error: clearOddsError } = await supabase
      .from('game_odds')
      .delete()
      .neq('id', 0);

    if (clearOddsError) {
      console.error('Error clearing existing odds:', clearOddsError);
      return;
    }

    let totalGames = 0;
    // Fetch schedule for each date
    while (currentDate <= endDate) {
      const games = await fetchScheduleAndOdds(currentDate);
      
      if (games.length > 0) {
        const { error } = await supabase
          .from('nba_schedule')
          .upsert(games, {
            onConflict: 'game_id',
            returning: 'minimal'
          });

        if (error) {
          console.error(`Error saving games for ${format(currentDate, 'yyyy-MM-dd')}:`, error);
        } else {
          console.log(`Saved ${games.length} games for ${format(currentDate, 'yyyy-MM-dd')}`);
          totalGames += games.length;
        }
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Move to next date
      currentDate = addDays(currentDate, 1);
    }

    console.log(`Finished fetching entire season schedule. Total games: ${totalGames}`);
  } catch (error) {
    console.error('Error fetching season schedule:', error);
    throw error;
  }
}

// Run the fetcher
fetchEntireSeason()
  .then(() => {
    console.log('Schedule fetch completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schedule fetch failed:', error);
    process.exit(1);
  });