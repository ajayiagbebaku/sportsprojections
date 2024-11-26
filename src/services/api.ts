import axios from 'axios';
import { format } from 'date-fns';
import { generatePrediction } from './statsService';
import { savePrediction, getPredictions } from './supabase';
import type { GamePrediction } from '../types';

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

// Create axios instance based on environment
const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? 'https://tank01-fantasy-stats.p.rapidapi.com'
    : 'http://localhost:3001/api',
  headers: import.meta.env.PROD ? {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': API_HOST,
  } : {}
});

export async function fetchNBAOdds(dateString: string): Promise<GamePrediction[]> {
  try {
    // First try to get predictions from Supabase
    const cachedPredictions = await getPredictions(dateString);
    if (cachedPredictions.length > 0) {
      console.log('Using cached predictions for:', dateString);
      return cachedPredictions;
    }

    // If no cached data, fetch from schedule and generate predictions
    const { data: scheduleGames, error: scheduleError } = await supabase
      .from('nba_schedule')
      .select('*')
      .eq('game_date', dateString);

    if (scheduleError) throw scheduleError;
    if (!scheduleGames?.length) {
      console.log('No games scheduled for:', dateString);
      return [];
    }

    const predictions: GamePrediction[] = [];

    for (const game of scheduleGames) {
      try {
        // Get odds from database or API
        const { data: odds, error: oddsError } = await supabase
          .from('game_odds')
          .select('*')
          .eq('game_id', game.game_id)
          .single();

        if (oddsError || !odds) {
          console.warn(`No odds found for game ${game.game_id}`);
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
          game_date: dateString,
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
          homeTeamMoneyline: odds.home_moneyline,
          awayTeamMoneyline: odds.away_moneyline
        });

      } catch (error) {
        console.error(`Error processing game ${game.game_id}:`, error);
      }
    }

    return predictions;
  } catch (error) {
    console.error('Error fetching NBA data:', error);
    throw new Error('Failed to fetch game data. Please try again later.');
  }
}