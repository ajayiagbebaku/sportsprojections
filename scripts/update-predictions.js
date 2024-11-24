import axios from 'axios';
import { format, subDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

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
        // Process game odds and store predictions
        // Implementation similar to your existing code
        console.log('Processing predictions for game:', gameId);
      }
    }

    // Update yesterday's game results
    if (scoresResponse.data?.body) {
      for (const [gameId, score] of Object.entries(scoresResponse.data.body)) {
        if (score.gameStatus === 'Completed' || score.gameClock === 'Final') {
          const actualHomeScore = parseInt(score.homePts);
          const actualAwayScore = parseInt(score.awayPts);

          if (!isNaN(actualHomeScore) && !isNaN(actualAwayScore)) {
            // Update the prediction record with actual scores
            const { error } = await supabase
              .from('predictions')
              .update({
                actual_home_score: actualHomeScore,
                actual_away_score: actualAwayScore
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
  } catch (error) {
    console.error('Error updating predictions:', error);
    process.exit(1);
  }
}

updatePredictions();