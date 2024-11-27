import { normalizeDate, validateDate } from './dateUtils';
import { getScheduledGames } from './scheduleService';
import { getGameOdds } from './oddsService';
import { getTeamStats } from './teamStatsService';
import { getExistingPredictions, savePrediction } from './predictionsService';
import { generatePrediction } from './statsService';
import type { GamePrediction } from '../types';

export async function fetchNBAOdds(dateString: string): Promise<GamePrediction[]> {
  try {
    if (!validateDate(dateString)) {
      throw new Error('Invalid date format');
    }

    const date = normalizeDate(dateString);
    console.log('Fetching predictions for date:', date);

    // Check existing predictions first
    const existingPredictions = await getExistingPredictions(date);
    if (existingPredictions.length > 0) {
      console.log(`Found ${existingPredictions.length} existing predictions`);
      return existingPredictions;
    }

    // Get scheduled games
    const games = await getScheduledGames(date);
    if (!games.length) {
      console.log('No games scheduled for:', date);
      return [];
    }
    console.log(`Found ${games.length} scheduled games`);

    // Get team stats
    const teamCodes = games.flatMap(game => [game.team_id_home, game.team_id_away]);
    const teamStats = await getTeamStats(teamCodes);

    // Get odds for all games
    const gameIds = games.map(game => game.game_id);
    const odds = await getGameOdds(date, gameIds);

    // Generate predictions
    const predictions: GamePrediction[] = [];

    for (const game of games) {
      const homeStats = teamStats.find(t => t.team_code === game.team_id_home);
      const awayStats = teamStats.find(t => t.team_code === game.team_id_away);
      const gameOdds = odds.find(o => o.game_id === game.game_id);

      if (!homeStats || !awayStats) {
        console.warn(`Missing stats for game ${game.game_id}`);
        continue;
      }

      const prediction = generatePrediction(homeStats, awayStats);
      
      // Ensure odds are properly handled
      const fanduelSpreadHome = gameOdds?.spread_home;
      const fanduelTotal = gameOdds?.total;
      const homeTeamMoneyline = gameOdds?.home_moneyline;
      const awayTeamMoneyline = gameOdds?.away_moneyline;

      const predictionRecord = {
        gameId: game.game_id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        totalScore: prediction.totalScore,
        projectedSpread: prediction.projectedSpread,
        fanduelSpreadHome,
        fanduelTotal,
        homeTeamMoneyline,
        awayTeamMoneyline,
        suggestedBet: determineSuggestedBet(
          prediction.projectedSpread,
          fanduelSpreadHome || 0,
          game.home_team,
          game.away_team
        ),
        overUnder: prediction.totalScore > (fanduelTotal || 0) ? 'Over' : 'Under'
      };

      // Save prediction to database
      await savePrediction({
        game_id: game.game_id,
        game_date: date,
        home_team: game.home_team,
        away_team: game.away_team,
        team_id_home: game.team_id_home,
        team_id_away: game.team_id_away,
        predicted_home_score: prediction.homeScore,
        predicted_away_score: prediction.awayScore,
        predicted_total: prediction.totalScore,
        fanduel_spread_home: fanduelSpreadHome || 0,
        fanduel_total: fanduelTotal || 0,
        home_moneyline: homeTeamMoneyline,
        away_moneyline: awayTeamMoneyline
      });

      predictions.push(predictionRecord);
    }

    return predictions;
  } catch (error) {
    console.error('Error fetching/generating predictions:', error);
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