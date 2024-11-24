import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Prediction {
  id?: number;
  game_id: string;
  game_date: string;
  home_team: string;
  away_team: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_total: number;
  fanduel_spread_home: number;
  fanduel_total: number;
  actual_home_score?: number;
  actual_away_score?: number;
  spread_result?: 'win' | 'loss' | 'push';
  total_result?: 'win' | 'loss' | 'push';
  created_at?: string;
}

export async function savePrediction(prediction: Omit<Prediction, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('predictions')
    .insert([prediction])
    .select();

  if (error) throw error;
  return data[0];
}

export async function updateGameResults(
  gameId: string,
  homeScore: number,
  awayScore: number
) {
  // Fetch the prediction first
  const { data: predictions, error: fetchError } = await supabase
    .from('predictions')
    .select('*')
    .eq('game_id', gameId)
    .single();

  if (fetchError) throw fetchError;
  if (!predictions) throw new Error('Prediction not found');

  const prediction = predictions as Prediction;
  
  // Calculate spread result
  const actualSpread = homeScore - awayScore;
  const predictedSpread = prediction.predicted_home_score - prediction.predicted_away_score;
  const spreadResult = calculateSpreadResult(
    actualSpread,
    prediction.fanduel_spread_home
  );

  // Calculate total result
  const actualTotal = homeScore + awayScore;
  const totalResult = calculateTotalResult(
    actualTotal,
    prediction.fanduel_total
  );

  // Update the prediction with results
  const { error: updateError } = await supabase
    .from('predictions')
    .update({
      actual_home_score: homeScore,
      actual_away_score: awayScore,
      spread_result: spreadResult,
      total_result: totalResult
    })
    .eq('game_id', gameId);

  if (updateError) throw updateError;
}

function calculateSpreadResult(
  actualSpread: number,
  fanduelSpread: number
): 'win' | 'loss' | 'push' {
  if (actualSpread === fanduelSpread) return 'push';
  return actualSpread > fanduelSpread ? 'win' : 'loss';
}

function calculateTotalResult(
  actualTotal: number,
  fanduelTotal: number
): 'win' | 'loss' | 'push' {
  if (actualTotal === fanduelTotal) return 'push';
  return actualTotal > fanduelTotal ? 'over' : 'under';
}

export async function getResults() {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .not('spread_result', 'is', null);

  if (error) throw error;

  const results = data.reduce((acc, prediction) => {
    return {
      spread: {
        wins: acc.spread.wins + (prediction.spread_result === 'win' ? 1 : 0),
        losses: acc.spread.losses + (prediction.spread_result === 'loss' ? 1 : 0),
        pushes: acc.spread.pushes + (prediction.spread_result === 'push' ? 1 : 0),
      },
      total: {
        wins: acc.total.wins + (prediction.total_result === 'win' ? 1 : 0),
        losses: acc.total.losses + (prediction.total_result === 'loss' ? 1 : 0),
        pushes: acc.total.pushes + (prediction.total_result === 'push' ? 1 : 0),
      }
    };
  }, {
    spread: { wins: 0, losses: 0, pushes: 0 },
    total: { wins: 0, losses: 0, pushes: 0 }
  });

  return results;
}