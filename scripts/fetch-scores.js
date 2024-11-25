import axios from 'axios';
import { format, subDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';
const RAPIDAPI_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const RAPIDAPI_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchAndSaveScores() {
  try {
    // Get yesterday's date in YYYYMMDD format
    const yesterday = subDays(new Date(), 1);
    const formattedDate = format(yesterday, 'yyyyMMdd');
    
    console.log('Fetching scores for date:', formattedDate);

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

    if (!response.data?.body) {
      console.log('No games found for date:', formattedDate);
      return;
    }

    const games = response.data.body;
    console.log(`Found ${Object.keys(games).length} games`);

    for (const [gameId, game] of Object.entries(games)) {
      try {
        // Validate scores
        const awayScore = parseInt(game.awayPts);
        const homeScore = parseInt(game.homePts);

        if (isNaN(awayScore) || isNaN(homeScore)) {
          console.warn(`Invalid scores for game ${gameId}`);
          continue;
        }

        // Prepare game record exactly matching your CSV format
        const gameRecord = {
          game_id: gameId,
          away_team: game.away,
          home_team: game.home,
          away_score: awayScore,
          home_score: homeScore,
          game_status: game.gameStatus || 'Unknown',
          game_clock: game.gameClock || null,
          game_time: game.gameTime || null
        };

        console.log('Saving game record:', gameRecord);

        // Save to Supabase
        const { error } = await supabase
          .from('game_scores')
          .upsert(gameRecord, {
            onConflict: 'game_id',
            returning: 'minimal'
          });

        if (error) {
          console.error(`Error saving game ${gameId}:`, error);
          continue;
        }

        console.log(`Successfully saved game ${gameId}`);

        // If game is completed, update predictions table
        if (game.gameStatus === 'Completed' || game.gameClock === 'Final') {
          await updatePredictionResults(gameId, homeScore, awayScore);
        }
      } catch (error) {
        console.error(`Error processing game ${gameId}:`, error);
      }
    }

    console.log('Finished processing all games');
  } catch (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }
}

async function updatePredictionResults(gameId, homeScore, awayScore) {
  try {
    // Get prediction for this game
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (predictionError) {
      console.warn(`No prediction found for game ${gameId}`);
      return;
    }

    // Calculate results
    const spreadResult = calculateSpreadResult(
      homeScore,
      awayScore,
      prediction.fanduel_spread_home
    );

    const totalResult = calculateTotalResult(
      homeScore + awayScore,
      prediction.fanduel_total
    );

    // Update prediction with results
    const { error: updateError } = await supabase
      .from('predictions')
      .update({
        actual_home_score: homeScore,
        actual_away_score: awayScore,
        spread_result: spreadResult,
        total_result: totalResult,
        game_status: 'Completed'
      })
      .eq('game_id', gameId);

    if (updateError) {
      console.error(`Error updating prediction for game ${gameId}:`, updateError);
    } else {
      console.log(`Updated prediction results for game ${gameId}`);
    }
  } catch (error) {
    console.error(`Error updating prediction results for game ${gameId}:`, error);
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
fetchAndSaveScores()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });