import { format, startOfDay } from 'date-fns';
import { generatePrediction } from './statsService';
import { supabase } from './supabase';
import type { GamePrediction } from '../types';

export async function fetchNBAOdds(dateString: string): Promise<GamePrediction[]> {
  try {
    const normalizedDate = format(startOfDay(new Date(dateString)), 'yyyy-MM-dd');
    console.log('Fetching predictions for date:', normalizedDate);

    // First check if we already have predictions for this date
    const { data: existingPredictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('game_date', normalizedDate);

    if (existingPredictions?.length) {
      console.log(`Found ${existingPredictions.length} existing predictions`);
      return existingPredictions.map(p => ({
        gameId: p.game_id,
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        homeScore: p.predicted_home_score,
        awayScore: p.predicted_away_score,
        totalScore: p.predicted_total,
        projectedSpread: p.predicted_home_score - p.predicted_away_score
      }));
    }

    // Get scheduled games for the date
    const { data: games, error } = await supabase
      .from('nba_schedule')
      .select('*')
      .eq('game_date', normalizedDate);

    if (error) throw error;
    if (!games?.length) {
      console.log('No games scheduled for:', normalizedDate);
      return [];
    }

    console.log(`Generating predictions for ${games.length} games`);
    const predictions: GamePrediction[] = [];

    // Get team stats for all teams playing today
    const teamIds = games.flatMap(game => [game.team_id_home, game.team_id_away]);
    const { data: teamStats } = await supabase
      .from('team_stats')
      .select('*')
      .in('team_id', teamIds);

    if (!teamStats?.length) {
      console.error('No team stats found');
      return [];
    }

    // Generate and store predictions for each game
    for (const game of games) {
      const homeStats = teamStats.find(t => t.team_id === game.team_id_home);
      const awayStats = teamStats.find(t => t.team_id === game.team_id_away);

      if (!homeStats || !awayStats) {
        console.warn(`Missing stats for game ${game.game_id}`);
        continue;
      }

      const prediction = generatePrediction(homeStats, awayStats);
      
      // Store prediction in database
      const { error: saveError } = await supabase
        .from('predictions')
        .upsert({
          game_id: game.game_id,
          game_date: normalizedDate,
          home_team: game.home_team,
          away_team: game.away_team,
          team_id_home: game.team_id_home,
          team_id_away: game.team_id_away,
          predicted_home_score: prediction.homeScore,
          predicted_away_score: prediction.awayScore,
          predicted_total: prediction.totalScore
        });

      if (saveError) {
        console.error(`Error saving prediction for game ${game.game_id}:`, saveError);
        continue;
      }

      predictions.push({
        gameId: game.game_id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        totalScore: prediction.totalScore,
        projectedSpread: prediction.projectedSpread
      });
    }

    return predictions;
  } catch (error) {
    console.error('Error fetching/generating predictions:', error);
    throw new Error('Failed to fetch/generate predictions');
  }
}