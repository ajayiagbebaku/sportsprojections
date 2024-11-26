import type { TeamStats } from '../types';

export function generatePrediction(homeStats: TeamStats, awayStats: TeamStats) {
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

  // Round scores
  homeScore = Math.round(homeScore);
  awayScore = Math.round(awayScore);

  return {
    homeScore,
    awayScore,
    totalScore: homeScore + awayScore,
    projectedSpread: homeScore - awayScore
  };
}