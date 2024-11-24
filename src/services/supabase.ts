import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';

// Create Supabase client with proper headers
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Prefer': 'return=minimal',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
});

export async function updateGameResults(gameId: string, homeScore: number, awayScore: number) {
  try {
    // Get the prediction for this game
    const { data: prediction } = await supabase
      .from('predictions')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (!prediction) {
      console.log(`No prediction found for game ${gameId}`);
      return;
    }

    // Calculate spread result
    const actualSpread = homeScore - awayScore;
    const spreadResult = calculateSpreadResult(actualSpread, prediction.fanduel_spread_home);

    // Calculate total result
    const actualTotal = homeScore + awayScore;
    const totalResult = calculateTotalResult(actualTotal, prediction.fanduel_total);

    // Update the prediction with results
    await supabase
      .from('predictions')
      .update({
        actual_home_score: homeScore,
        actual_away_score: awayScore,
        spread_result: spreadResult,
        total_result: totalResult,
        completed: true
      })
      .eq('game_id', gameId);

  } catch (error) {
    console.error('Error updating game results:', error);
    throw error;
  }
}

export async function getResults() {
  try {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('completed', true);

    if (!predictions) {
      return {
        spread: { wins: 0, losses: 0, pushes: 0 },
        total: { wins: 0, losses: 0, pushes: 0 }
      };
    }

    return predictions.reduce((acc, game) => {
      // Count spread results
      if (game.spread_result === 'win') acc.spread.wins++;
      else if (game.spread_result === 'loss') acc.spread.losses++;
      else if (game.spread_result === 'push') acc.spread.pushes++;

      // Count total results
      if (game.total_result === 'win') acc.total.wins++;
      else if (game.total_result === 'loss') acc.total.losses++;
      else if (game.total_result === 'push') acc.total.pushes++;

      return acc;
    }, {
      spread: { wins: 0, losses: 0, pushes: 0 },
      total: { wins: 0, losses: 0, pushes: 0 }
    });
  } catch (error) {
    console.error('Error getting results:', error);
    throw error;
  }
}

function calculateSpreadResult(actualSpread: number, predictedSpread: number): 'win' | 'loss' | 'push' {
  if (actualSpread === predictedSpread) return 'push';
  return actualSpread > predictedSpread ? 'win' : 'loss';
}

function calculateTotalResult(actualTotal: number, predictedTotal: number): 'win' | 'loss' | 'push' {
  if (actualTotal === predictedTotal) return 'push';
  return actualTotal > predictedTotal ? 'over' : 'under';
}