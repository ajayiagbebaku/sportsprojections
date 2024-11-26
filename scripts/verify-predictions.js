import { createClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyPredictions() {
  try {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    console.log('Checking predictions for:', yesterday);

    // Get yesterday's predictions
    const { data: predictions, error: predictionError } = await supabase
      .from('predictions')
      .select('*')
      .eq('game_date', yesterday);

    if (predictionError) {
      throw predictionError;
    }

    console.log(`Found ${predictions?.length || 0} predictions for ${yesterday}`);

    // Get yesterday's actual scores
    const { data: scores, error: scoresError } = await supabase
      .from('game_scores')
      .select('*')
      .like('game_id', `${yesterday.replace(/-/g, '')}%`);

    if (scoresError) {
      throw scoresError;
    }

    console.log(`Found ${scores?.length || 0} actual scores for ${yesterday}`);

    // Match predictions with actual scores and update results
    for (const prediction of predictions || []) {
      const actualGame = scores?.find(s => s.game_id === prediction.game_id);
      
      if (!actualGame) {
        console.log(`No actual score found for game ${prediction.game_id}`);
        continue;
      }

      console.log(`\nAnalyzing game: ${prediction.game_id}`);
      console.log('Prediction:', {
        home: `${prediction.home_team}: ${prediction.predicted_home_score}`,
        away: `${prediction.away_team}: ${prediction.predicted_away_score}`,
        spread: prediction.fanduel_spread_home,
        total: prediction.fanduel_total
      });
      console.log('Actual:', {
        home: `${actualGame.home_team}: ${actualGame.home_score}`,
        away: `${actualGame.away_team}: ${actualGame.away_score}`
      });

      // Calculate results
      const actualSpread = actualGame.home_score - actualGame.away_score;
      const spreadResult = calculateSpreadResult(actualSpread, prediction.fanduel_spread_home);
      
      const actualTotal = actualGame.home_score + actualGame.away_score;
      const totalResult = calculateTotalResult(actualTotal, prediction.fanduel_total);

      console.log('Results:', {
        spread: spreadResult,
        total: totalResult
      });

      // Update prediction with results
      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          actual_home_score: actualGame.home_score,
          actual_away_score: actualGame.away_score,
          spread_result: spreadResult,
          total_result: totalResult,
          game_status: 'Completed'
        })
        .eq('game_id', prediction.game_id);

      if (updateError) {
        console.error(`Error updating results for game ${prediction.game_id}:`, updateError);
      } else {
        console.log(`Updated results for game ${prediction.game_id}`);
      }
    }

  } catch (error) {
    console.error('Error verifying predictions:', error);
    throw error;
  }
}

function calculateSpreadResult(actualSpread, predictedSpread) {
  if (Math.abs(actualSpread - predictedSpread) < 0.5) {
    return 'push';
  }
  return actualSpread > predictedSpread ? 'win' : 'loss';
}

function calculateTotalResult(actualTotal, predictedTotal) {
  if (Math.abs(actualTotal - predictedTotal) < 0.5) {
    return 'push';
  }
  return actualTotal > predictedTotal ? 'over' : 'under';
}

// Run the verification
verifyPredictions()
  .then(() => {
    console.log('\nVerification completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nVerification failed:', error);
    process.exit(1);
  });