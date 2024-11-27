import { supabase } from './supabase';
import { normalizeDate } from './dateUtils';
import type { GamePrediction } from '../types';

interface PredictionRecord {
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
  actual_home_score?: number;
  actual_away_score?: number;
  game_status?: string;
  spread_result?: 'win' | 'loss' | 'push';
  total_result?: 'win' | 'loss' | 'push';
}

export async function getExistingPredictions(date: string): Promise<GamePrediction[]> {
  const normalizedDate = normalizeDate(date);
  console.log('Getting existing predictions for:', normalizedDate);
  
  const { data: predictions, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('game_date', normalizedDate);

  if (error) {
    console.error('Error fetching predictions:', error);
    throw error;
  }

  if (!predictions?.length) {
    console.log('No existing predictions found for:', normalizedDate);
    return [];
  }

  console.log(`Found ${predictions.length} existing predictions for ${normalizedDate}`);
  return predictions.map(p => ({
    gameId: p.game_id,
    homeTeam: p.home_team,
    awayTeam: p.away_team,
    homeScore: p.predicted_home_score,
    awayScore: p.predicted_away_score,
    totalScore: p.predicted_total,
    projectedSpread: p.predicted_home_score - p.predicted_away_score,
    fanduelSpreadHome: p.fanduel_spread_home,
    fanduelTotal: p.fanduel_total,
    homeTeamMoneyline: p.home_moneyline,
    awayTeamMoneyline: p.away_moneyline,
    actualHomeScore: p.actual_home_score,
    actualAwayScore: p.actual_away_score,
    gameStatus: p.game_status,
    spreadResult: p.spread_result,
    totalResult: p.total_result,
    suggestedBet: determineSuggestedBet(
      p.predicted_home_score - p.predicted_away_score,
      p.fanduel_spread_home,
      p.home_team,
      p.away_team
    ),
    overUnder: p.predicted_total > p.fanduel_total ? 'Over' : 'Under'
  }));
}

export async function savePrediction(prediction: PredictionRecord) {
  try {
    const { data: existing } = await supabase
      .from('predictions')
      .select('game_id')
      .eq('game_id', prediction.game_id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('predictions')
        .update(prediction)
        .eq('game_id', prediction.game_id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('predictions')
        .insert(prediction);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving prediction:', error);
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