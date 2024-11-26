import { format, startOfDay } from 'date-fns';
import { generatePrediction } from './statsService';
import { savePrediction, getPredictions } from './supabase';
import { supabase } from './supabase';
import type { GamePrediction } from '../types';

export async function fetchNBAOdds(dateString: string): Promise<GamePrediction[]> {
  try {
    // Normalize the date to start of day to ensure consistent matching
    const normalizedDate = format(startOfDay(new Date(dateString)), 'yyyy-MM-dd');
    console.log('Fetching predictions for date:', normalizedDate);

    // First try to get predictions from Supabase
    const cachedPredictions = await getPredictions(normalizedDate);
    if (cachedPredictions.length > 0) {
      console.log('Using cached predictions for:', normalizedDate);
      return cachedPredictions;
    }

    // If no cached data, fetch schedule and generate predictions
    const { data: scheduleGames, error: scheduleError } = await supabase
      .from('nba_schedule')
      .select('*')
      .eq('game_date', normalizedDate);

    if (scheduleError) {
      console.error('Error fetching schedule:', scheduleError);
      throw scheduleError;
    }

    if (!scheduleGames?.length) {
      console.log('No games scheduled for:', normalizedDate);
      return [];
    }

    console.log(`Found ${scheduleGames.length} scheduled games for ${normalizedDate}`);
    const predictions: GamePrediction[] = [];

    for (const game of scheduleGames) {
      try {
        // Get odds from database
        const { data: odds, error: oddsError } = await supabase
          .from('game_odds')
          .select('*')
          .eq('game_id', game.game_id)
          .single();

        if (oddsError || !odds) {
          console.warn(`No odds found for game ${game.game_id}`);
          continue;
        }

        if (!game.team_id_home || !game.team_id_away) {
          console.warn(`Missing team IDs for game ${game.game_id}`);
          continue;
        }

        // Generate prediction using database stats
        const prediction = await generatePrediction(
          game.home_team,
          game.away_team,
          game.team_id_home,
          game.team_id_away,
          odds.spread_home,
          odds.total
        );

        // Save prediction to Supabase
        await savePrediction({
          game_id: game.game_id,
          game_date: normalizedDate,
          home_team: game.home_team,
          away_team: game.away_team,
          team_id_home: game.team_id_home,
          team_id_away: game.team_id_away,
          predicted_home_score: prediction.homeScore,
          predicted_away_score: prediction.awayScore,
          predicted_total: prediction.totalScore,
          fanduel_spread_home: odds.spread_home,
          fanduel_total: odds.total,
          home_moneyline: odds.home_moneyline,
          away_moneyline: odds.away_moneyline
        });

        predictions.push({
          gameId: game.game_id,
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          homeScore: prediction.homeScore,
          awayScore: prediction.awayScore,
          totalScore: prediction.totalScore,
          suggestedBet: prediction.suggestedBet,
          overUnder: prediction.overUnder,
          fanduelSpreadHome: odds.spread_home,
          fanduelTotal: odds.total,
          homeTeamMoneyline: odds.home_moneyline || 0,
          awayTeamMoneyline: odds.away_moneyline || 0
        });

      } catch (error) {
        console.error(`Error processing game ${game.game_id}:`, error);
      }
    }

    console.log(`Generated ${predictions.length} predictions for ${normalizedDate}`);
    return predictions;
  } catch (error) {
    console.error('Error fetching NBA data:', error);
    throw new Error('Failed to fetch game data. Please try again later.');
  }
}