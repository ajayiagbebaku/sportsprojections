import { format, startOfDay } from 'date-fns';
import { generatePrediction } from './statsService';
import { supabase } from './supabase';
import type { GamePrediction } from '../types';

export async function fetchNBAOdds(dateString: string): Promise<GamePrediction[]> {
  try {
    const normalizedDate = format(startOfDay(new Date(dateString)), 'yyyy-MM-dd');
    console.log('Fetching games for date:', normalizedDate);

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

    console.log(`Found ${games.length} games for ${normalizedDate}`);
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

    // Generate predictions for each game
    for (const game of games) {
      const homeStats = teamStats.find(t => t.team_id === game.team_id_home);
      const awayStats = teamStats.find(t => t.team_id === game.team_id_away);

      if (!homeStats || !awayStats) {
        console.warn(`Missing stats for game ${game.game_id}`);
        continue;
      }

      const prediction = generatePrediction(homeStats, awayStats);
      
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
    console.error('Error fetching games:', error);
    throw new Error('Failed to fetch game data');
  }
}