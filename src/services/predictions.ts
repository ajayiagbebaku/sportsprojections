import { teamStats } from '../data/teamStats';
import type { TeamStats } from '../types';

// Simple implementation of linear regression for score prediction
function predictScore(team: TeamStats, opponent: TeamStats, isHome: boolean): number {
  // Factors to consider: team's scoring, opponent's defense, pace, and home court advantage
  const homeAdvantage = isHome ? 3.5 : 0; // NBA home court advantage is typically ~3.5 points
  const paceAdjustment = (team.pace + opponent.pace) / 200; // Normalize pace factor

  // Predict score based on:
  // 1. Team's scoring ability (PPG)
  // 2. Opponent's defensive weakness (OPPG)
  // 3. Pace adjustment
  // 4. Home court advantage
  const predictedScore = (
    (team.ppg + opponent.oppg) / 2 * // Offensive/defensive balance
    paceAdjustment + // Adjust for game pace
    homeAdvantage // Add home court advantage if applicable
  );

  return Math.round(predictedScore);
}

export function generatePrediction(
  homeTeam: string,
  awayTeam: string,
  fanduelSpreadHome: number,
  fanduelTotal: number
) {
  const homeStats = teamStats[homeTeam];
  const awayStats = teamStats[awayTeam];

  if (!homeStats || !awayStats) {
    throw new Error('Team stats not found');
  }

  const predictedHomeScore = predictScore(homeStats, awayStats, true);
  const predictedAwayScore = predictScore(awayStats, homeStats, false);
  const predictedTotal = predictedHomeScore + predictedAwayScore;
  const predictedSpread = predictedHomeScore - predictedAwayScore;

  // Determine betting suggestions
  const suggestedBet = Math.abs(predictedSpread) > Math.abs(fanduelSpreadHome)
    ? `Bet on ${predictedSpread > 0 ? homeTeam : awayTeam}`
    : 'No clear edge';

  const overUnder = predictedTotal > fanduelTotal ? 'Over' : 'Under';

  return {
    homeScore: predictedHomeScore,
    awayScore: predictedAwayScore,
    totalScore: predictedTotal,
    suggestedBet,
    overUnder
  };
}