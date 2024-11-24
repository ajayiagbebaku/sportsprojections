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
  // If our projected spread is better than the Vegas spread by at least 2 points,
  // we have an edge
  const MINIMUM_EDGE = 2;
  let suggestedBet = 'No clear edge';

  // Example: 
  // Vegas: Lakers -4 (fanduelSpreadHome = -4)
  // Our projection: Lakers win by 1 (projectedSpread = 1)
  // 1 < |-4| so bet on the other team (not covering the spread)
  
  if (Math.abs(projectedSpread - fanduelSpreadHome) >= MINIMUM_EDGE) {
    if (projectedSpread < Math.abs(fanduelSpreadHome)) {
      // Our projection shows the favorite won't cover
      suggestedBet = fanduelSpreadHome < 0 ? `Bet on ${awayTeam}` : `Bet on ${homeTeam}`;
    } else {
      // Our projection shows the favorite will cover
      suggestedBet = fanduelSpreadHome < 0 ? `Bet on ${homeTeam}` : `Bet on ${awayTeam}`;
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