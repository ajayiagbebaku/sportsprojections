import axios from 'axios';
import { format, subDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'RAPIDAPI_KEY', 'RAPIDAPI_HOST'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const api = axios.create({
  baseURL: 'https://tank01-fantasy-stats.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
  }
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updatePredictions() {
  try {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const todayFormatted = format(today, 'yyyyMMdd');
    const yesterdayFormatted = format(yesterday, 'yyyyMMdd');

    console.log('Updating predictions for:', todayFormatted);
    console.log('Updating scores for:', yesterdayFormatted);

    // Get today's odds for new predictions
    const oddsResponse = await api.get('/getNBABettingOdds', {
      params: {
        gameDate: todayFormatted,
        itemFormat: 'list'
      }
    });

    // Get yesterday's scores to update results
    const scoresResponse = await api.get('/getNBAScoresOnly', {
      params: {
        gameDate: yesterdayFormatted,
        topPerformers: 'false',
        lineups: 'false'
      }
    });

    // Process and store new predictions
    if (oddsResponse.data?.body) {
      for (const [gameId, game] of Object.entries(oddsResponse.data.body)) {
        try {
          const homeTeamKey = teamCodeMapping[game.homeTeam];
          const awayTeamKey = teamCodeMapping[game.awayTeam];

          if (!homeTeamKey || !awayTeamKey) {
            console.warn(`Unknown team mapping for ${game.homeTeam} or ${game.awayTeam}`);
            continue;
          }

          const fanduelBook = game.sportsBooks?.find(book => 
            book.sportsBook.toLowerCase() === 'fanduel'
          );
          
          if (!fanduelBook?.odds) {
            console.warn('No FanDuel odds found for game', gameId);
            continue;
          }

          const fanduelOdds = fanduelBook.odds;
          const fanduelSpreadHome = parseFloat(fanduelOdds.homeTeamSpread);
          const fanduelTotal = parseFloat(fanduelOdds.totalOver);
          const homeMoneyline = parseInt(fanduelOdds.homeTeamMLOdds);
          const awayMoneyline = parseInt(fanduelOdds.awayTeamMLOdds);

          if (isNaN(fanduelSpreadHome) || isNaN(fanduelTotal)) {
            console.warn('Invalid odds values for game', gameId);
            continue;
          }

          // Save prediction to Supabase
          const { error } = await supabase
            .from('predictions')
            .upsert({
              game_id: gameId,
              game_date: format(today, 'yyyy-MM-dd'),
              home_team: homeTeamKey,
              away_team: awayTeamKey,
              fanduel_spread_home: fanduelSpreadHome,
              fanduel_total: fanduelTotal,
              home_moneyline: homeMoneyline,
              away_moneyline: awayMoneyline
            });

          if (error) {
            console.error(`Error saving prediction for game ${gameId}:`, error);
          } else {
            console.log(`Saved prediction for game ${gameId}`);
          }
        } catch (error) {
          console.error(`Error processing game ${gameId}:`, error);
        }
      }
    }

    // Update yesterday's game results
    if (scoresResponse.data?.body) {
      for (const [gameId, score] of Object.entries(scoresResponse.data.body)) {
        if (score.gameStatus === 'Completed' || score.gameClock === 'Final') {
          const actualHomeScore = parseInt(score.homePts);
          const actualAwayScore = parseInt(score.awayPts);

          if (!isNaN(actualHomeScore) && !isNaN(actualAwayScore)) {
            const { error } = await supabase
              .from('predictions')
              .update({
                actual_home_score: actualHomeScore,
                actual_away_score: actualAwayScore,
                game_status: 'Completed'
              })
              .eq('game_id', gameId);

            if (error) {
              console.error(`Error updating scores for game ${gameId}:`, error);
            } else {
              console.log(`Updated scores for game ${gameId}`);
            }
          }
        }
      }
    }

    console.log('Finished updating predictions and scores');
    process.exit(0);
  } catch (error) {
    console.error('Error updating predictions:', error);
    process.exit(1);
  }
}

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

updatePredictions();