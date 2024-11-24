import { teamStats } from '../data/teamStats';

export function generatePrediction(
  homeTeam: string,
  awayTeam: string,
  fanduelSpreadHome: number,
  fanduelTotal: number,
  isPlayoffs: boolean = false
) {
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
  // If home team is favored (negative spread):
  // - We need them to win by MORE than the spread amount
  // If home team is underdog (positive spread):
  // - They can lose by less than the spread amount or win outright
  
  const MINIMUM_EDGE = 2;
  let suggestedBet = 'No clear edge';

  if (Math.abs(projectedSpread - fanduelSpreadHome) >= MINIMUM_EDGE) {
    // For negative spread (home favorite), we need projectedSpread > |fanduelSpreadHome|
    // For positive spread (home underdog), we need projectedSpread > -fanduelSpreadHome
    if (fanduelSpreadHome <= 0) {
      // Home team is favored
      suggestedBet = projectedSpread > Math.abs(fanduelSpreadHome)
        ? `Bet on ${homeTeam}` // Projected to cover
        : `Bet on ${awayTeam}`; // Not projected to cover
    } else {
      // Away team is favored
      suggestedBet = projectedSpread > -fanduelSpreadHome
        ? `Bet on ${homeTeam}` // Projected to cover
        : `Bet on ${awayTeam}`; // Not projected to cover
    }
  }

  return {
    homeScore,
    awayScore,
    totalScore,
    suggestedBet,
    overUnder: totalScore > fanduelTotal ? 'Over' : 'Under'
  };
}