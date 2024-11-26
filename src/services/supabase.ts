import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import type { GamePrediction } from '../types';

const supabaseUrl = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';

export const supabase = createClient(supabaseUrl, supabaseKey);

interface PredictionRecord {
  id?: number;
  game_id: string;
  game_date: string;
  home_team: string;
  away_team: string;
  team_id_home: string;
  team_id_away: string;
  predicted_home_score: number;
  predicted_away_score: number;
  predicted_total: number;
  fanduel_spread_home: number;
  fanduel_total: number;
  home_moneyline?: number;
  away_moneyline?: number;
  actual_home_score?: number | null;
  actual_away_score?: number | null;
  spread_result?: 'win' | 'loss' | 'push' | null;
  total_result?: 'win' | 'loss' | 'push' | null;
}

export async function getPredictions(date: string): Promise<GamePrediction[]> {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('game_date', date);

    if (error) throw error;
    if (!data) return [];

    return data.map(record => ({
      gameId: record.game_id,
      homeTeam: record.home_team,
      awayTeam: record.away_team,
      homeScore: record.predicted_home_score,
      awayScore: record.predicted_away_score,
      totalScore: record.predicted_total,
      suggestedBet: determineSuggestedBet(
        record.predicted_home_score - record.predicted_away_score,
        record.fanduel_spread_home,
        record.home_team,
        record.away_team
      ),
      overUnder: record.predicted_total > record.fanduel_total ? 'Over' : 'Under',
      fanduelSpreadHome: record.fanduel_spread_home,
      fanduelTotal: record.fanduel_total,
      homeTeamMoneyline: record.home_moneyline || 0,
      awayTeamMoneyline: record.away_moneyline || 0,
      actualHomeScore: record.actual_home_score || undefined,
      actualAwayScore: record.actual_away_score || undefined,
      gameStatus: record.actual_home_score ? 'Completed' : undefined,
      spreadResult: record.spread_result || undefined,
      totalResult: record.total_result || undefined
    }));
  } catch (error) {
    console.error('Error fetching predictions:', error);
    throw error;
  }
}

export async function savePrediction(prediction: Omit<PredictionRecord, 'id'>) {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('predictions')
      .select('id')
      .eq('game_id', prediction.game_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking prediction:', checkError);
      throw checkError;
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('predictions')
        .update(prediction)
        .eq('id', existing.id);

      if (updateError) throw updateError;
      console.log(`Updated prediction for game ${prediction.game_id}`);
      return;
    }

    const { error: insertError } = await supabase
      .from('predictions')
      .insert([prediction]);

    if (insertError) throw insertError;
    console.log(`Saved new prediction for game ${prediction.game_id}`);
  } catch (error) {
    console.error('Error in savePrediction:', error);
    throw error;
  }
}

function determineSuggestedBet(
  predictedSpread: number,
  fanduelSpread: number,
  homeTeam: string,
  awayTeam: string
): string {
  const MINIMUM_EDGE = 2;
  
  if (Math.abs(predictedSpread - fanduelSpread) >= MINIMUM_EDGE) {
    if (predictedSpread < Math.abs(fanduelSpread)) {
      return fanduelSpread < 0 ? `Bet on ${awayTeam}` : `Bet on ${homeTeam}`;
    } else {
      return fanduelSpread < 0 ? `Bet on ${homeTeam}` : `Bet on ${awayTeam}`;
    }
  }
  
  return 'No clear edge';
}