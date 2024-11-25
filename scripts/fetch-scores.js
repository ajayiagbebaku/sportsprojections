import axios from 'axios';
import { format, subDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const RAPIDAPI_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const RAPIDAPI_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const supabase = createClient(
  'https://yjebzlvsjonvxfpcuwaa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU'
);

async function fetchAndProcessScores() {
  try {
    // Get yesterday's date in YYYYMMDD format
    const yesterday = subDays(new Date(), 1);
    const formattedDate = format(yesterday, 'yyyyMMdd');
    
    console.log('Fetching scores for:', formattedDate);

    const response = await axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBAScoresOnly', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      params: {
        gameDate: formattedDate,
        topPerformers: 'false',
        lineups: 'false'
      }
    });

    if (response.data?.statusCode !== 200 || !response.data?.body) {
      console.log('No games found for date:', formattedDate);
      return;
    }

    const games = response.data.body;
    console.log(`Found ${Object.keys(games).length} games`);

    // Process each game
    for (const [gameId, game] of Object.entries(games)) {
      if (game.gameStatus === 'Completed' || game.gameClock === 'Final') {
        const actualHomeScore = parseInt(game.homePts);
        const actualAwayScore = parseInt(game.awayPts);

        if (isNaN(actualHomeScore) || isNaN(actualAwayScore)) {
          console.warn(`Invalid scores for game ${gameId}`);
          continue;
        }

        // Get prediction for this game
        const { data: prediction, error: predictionError } = await supabase
          .from('predictions')
          .select('*')
          .eq('game_id', gameId)
          .single();

        if (predictionError) {
          console.warn(`No prediction found for game ${gameId}`);
          continue;
        }

        // Calculate betting results
        const spreadResult = calculateSpreadResult(
          actualHomeScore,
          actualAwayScore,
          prediction.fanduel_spread_home
        );

        const totalResult = calculateTotalResult(
          actualHomeScore + actualAwayScore,
          prediction.fanduel_total
        );

        // Update prediction with results
        const { error: updateError } = await supabase
          .from('predictions')
          .update({
            actual_home_score: actualHomeScore,
            actual_away_score: actualAwayScore,
            spread_result: spreadResult,
            total_result: totalResult,
            game_status: 'Completed'
          })
          .eq('game_id', gameId);

        if (updateError) {
          console.error(`Error updating game ${gameId}:`, updateError);
        } else {
          console.log(`Updated results for game ${gameId}: Spread ${spreadResult}, Total ${totalResult}`);
        }
      }
    }
  } catch (error) {
    console.error('Error processing scores:', error);
    throw error;
  }
}

function calculateSpreadResult(actualHomeScore, actualAwayScore, spreadHome) {
  const actualSpread = actualHomeScore - actualAwayScore;
  
  if (Math.abs(actualSpread - spreadHome) < 0.5) {
    return 'push';
  }
  
  return actualSpread > spreadHome ? 'win' : 'loss';
}

function calculateTotalResult(actualTotal, predictedTotal) {
  if (Math.abs(actualTotal - predictedTotal) < 0.5) {
    return 'push';
  }
  
  return actualTotal > predictedTotal ? 'over' : 'under';
}

// Run the script
fetchAndProcessScores();