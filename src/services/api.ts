import { normalizeDate, validateDate } from './dateUtils';
import { getScheduledGames } from './scheduleService';
import { fetchAndSaveOdds } from './oddsService';
import { getTeamStats } from './teamStatsService';
import { getExistingPredictions, savePrediction } from './predictionsService';
import { generatePrediction } from './statsService';
import type { GamePrediction } from '../types';

export async function fetchNBAOdds(dateString: string): Promise<GamePrediction[]> {
  try {
    console.log('\n=== Starting fetchNBAOdds ===');
    if (!validateDate(dateString)) {
      throw new Error('Invalid date format');
    }

    const date = normalizeDate(dateString);
    console.log('Normalized date:', date);

    // Get scheduled games
    const games = await getScheduledGames(date);
    if (!games.length) {
      console.log('No games scheduled for:', date);
      return [];
    }
    console.log(`Found ${games.length} scheduled games`);

    // Get team stats
    const teamCodes = games.flatMap(game => [game.team_id_home, game.team_id_away]);
    console.log('Team codes to fetch:', teamCodes);
    const teamStats = await getTeamStats(teamCodes);

    // Always fetch fresh odds
    console.log('Fetching fresh odds...');
    const odds = await fetchAndSaveOdds(date);
    console.log(`Retrieved odds for ${odds.length} games`);

    // Generate predictions
    const predictions: GamePrediction[] = [];

    for (const game of games) {
      console.log(`\nProcessing game: ${game.game_id}`);
      const homeStats = teamStats.find(t => t.team_code === game.team_id_home);
      const awayStats = teamStats.find(t => t.team_code === game.team_id_away);
      const gameOdds = odds.find(o => o.game_id === game.game_id);

      if (!homeStats || !awayStats) {
        console.warn(`Missing stats for game ${game.game_id}`);
        continue;
      }

      const prediction = generatePrediction(homeStats, awayStats);
      console.log('Generated prediction:', prediction);
      
      // Save prediction to database
      const predictionRecord = {
        game_id: game.game_id,
        game_date: date,
        home_team: game.home_team,
        away_team: game.away_team,
        team_id_home: game.team_id_home,
        team_id_away: game.team_id_away,
        predicted_home_score: prediction.homeScore,
        predicted_away_score: prediction.awayScore,
        predicted_total: prediction.totalScore,
        fanduel_spread_home: gameOdds?.spread_home || 0,
        fanduel_total: gameOdds?.total || 0,
        home_moneyline: gameOdds?.home_moneyline,
        away_moneyline: gameOdds?.away_moneyline
      };

      await savePrediction(predictionRecord);

      predictions.push({
        gameId: game.game_id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
        totalScore: prediction.totalScore,
        projectedSpread: prediction.projectedSpread,
        fanduelSpreadHome: gameOdds?.spread_home || 0,
        fanduelTotal: gameOdds?.total || 0,
        homeTeamMoneyline: gameOdds?.home_moneyline,
        awayTeamMoneyline: gameOdds?.away_moneyline,
        suggestedBet: determineSuggestedBet(
          prediction.projectedSpread,
          gameOdds?.spread_home || 0,
          game.home_team,
          game.away_team
        ),
        overUnder: prediction.totalScore > (gameOdds?.total || 0) ? 'Over' : 'Under'
      });
    }

    console.log(`\nGenerated ${predictions.length} predictions`);
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