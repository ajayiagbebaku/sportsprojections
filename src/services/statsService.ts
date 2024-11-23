import { teamStats } from '../data/teamStats';
import type { TeamStats } from '../types';

export function generatePrediction(
  homeTeam: string,
  awayTeam: string,
  fanduelSpreadHome: number,
  fanduelTotal: number,
  isPlayoffs: boolean = false
): {
  homeScore: number;
  awayScore: number;
  totalScore: number;
  suggestedBet: string;
  overUnder: string;
} {
  const homeStats = teamStats[homeTeam];
  const awayStats = teamStats[awayTeam];

  if (!homeStats || !awayStats) {
    throw new Error(`Stats not found for ${homeTeam} or ${awayTeam}`);
  }

  // Calculate base scores using team stats
  let homeScore = (homeStats.ppg + awayStats.oppg) / 2;
  let awayScore = (awayStats.ppg + homeStats.oppg) / 2;

  // Apply pace adjustment
  const paceAdjustment = (homeStats.pace + awayStats.pace) / 200;
  homeScore *= paceAdjustment;
  awayScore *= paceAdjustment;

  // Apply home court advantage
  const homeAdvantage = 3.5;
  homeScore += homeAdvantage;

  // Apply playoff adjustments if needed
  if (isPlayoffs) {
    homeScore = homeScore - 7.5 + 2.5; // Less scoring in playoffs + home advantage
    awayScore -= 7.5; // Less scoring in playoffs
  }

  // Round scores
  homeScore = Math.round(homeScore);
  awayScore = Math.round(awayScore);

  const totalScore = homeScore + awayScore;
  const projectedSpread = homeScore - awayScore;

  // Betting logic:
  // If fanduelSpreadHome is -3, home team needs to win by more than 3
  // If projectedSpread is less than the absolute value of fanduelSpreadHome,
  // then the underdog will cover
  let suggestedBet;
  const spreadDifference = Math.abs(projectedSpread - fanduelSpreadHome);
  
  if (spreadDifference >= 2) { // Only suggest bets with at least 2 points edge
    if (projectedSpread < Math.abs(fanduelSpreadHome)) {
      // Underdog will cover
      suggestedBet = `Bet on ${awayTeam}`;
    } else {
      // Favorite will cover
      suggestedBet = `Bet on ${homeTeam}`;
    }
  } else {
    suggestedBet = 'No clear edge';
  }

  return {
    homeScore,
    awayScore,
    totalScore,
    suggestedBet,
    overUnder: totalScore > fanduelTotal ? 'Over' : 'Under'
  };
}