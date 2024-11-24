// NBA team stats for prediction calculations
export const teamStats = {
  "Atlanta": {"ppg": 114.9, "oppg": 119.6, "pace": 103.3},
  "Boston": {"ppg": 121.5, "oppg": 111.8, "pace": 97.3},
  "Brooklyn": {"ppg": 111.7, "oppg": 114.7, "pace": 96.3},
  "Charlotte": {"ppg": 110.1, "oppg": 114.5, "pace": 97.7},
  "Chicago": {"ppg": 115.4, "oppg": 122.9, "pace": 104.2},
  "Cleveland": {"ppg": 123.5, "oppg": 111.2, "pace": 99.8},
  "Dallas": {"ppg": 115.6, "oppg": 109.3, "pace": 98.1},
  "Denver": {"ppg": 116.5, "oppg": 115.1, "pace": 100.2},
  "Detroit": {"ppg": 110.4, "oppg": 111.6, "pace": 97.8},
  "Golden State": {"ppg": 119.6, "oppg": 109.1, "pace": 101.7},
  "Houston": {"ppg": 114.6, "oppg": 106.2, "pace": 100.3},
  "Indiana": {"ppg": 114.3, "oppg": 118.4, "pace": 99.5},
  "LA Clippers": {"ppg": 108.9, "oppg": 108.1, "pace": 97.6},
  "LA Lakers": {"ppg": 117.3, "oppg": 116.2, "pace": 99.0},
  "Memphis": {"ppg": 118.9, "oppg": 112.6, "pace": 104.1},
  "Miami": {"ppg": 110.9, "oppg": 110.1, "pace": 97.2},
  "Milwaukee": {"ppg": 111.3, "oppg": 112.2, "pace": 98.6},
  "Minnesota": {"ppg": 113.3, "oppg": 111.0, "pace": 98.1},
  "New Orleans": {"ppg": 103.5, "oppg": 115.4, "pace": 96.3},
  "New York": {"ppg": 118.3, "oppg": 111.9, "pace": 96.0},
  "Oklahoma City": {"ppg": 114.3, "oppg": 103.6, "pace": 100.5},
  "Orlando": {"ppg": 106.8, "oppg": 103.2, "pace": 97.5},
  "Philadelphia": {"ppg": 103.9, "oppg": 112.6, "pace": 96.6},
  "Phoenix": {"ppg": 112.1, "oppg": 114.5, "pace": 96.8},
  "Portland": {"ppg": 106.8, "oppg": 113.8, "pace": 100.3},
  "Sacramento": {"ppg": 116.9, "oppg": 113.7, "pace": 98.6},
  "San Antonio": {"ppg": 110.1, "oppg": 110.1, "pace": 98.7},
  "Toronto": {"ppg": 113.2, "oppg": 118.6, "pace": 98.9},
  "Utah": {"ppg": 108.7, "oppg": 119.3, "pace": 99.7},
  "Washington": {"ppg": 109.9, "oppg": 124.7, "pace": 103.0}
};

export function generatePrediction(
  homeTeam,
  awayTeam,
  fanduelSpreadHome,
  fanduelTotal,
  isPlayoffs = false
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

  // Betting logic
  const MINIMUM_EDGE = 2;
  let suggestedBet = 'No clear edge';
  
  if (Math.abs(projectedSpread - fanduelSpreadHome) >= MINIMUM_EDGE) {
    if (projectedSpread < Math.abs(fanduelSpreadHome)) {
      suggestedBet = fanduelSpreadHome < 0 ? `Bet on ${awayTeam}` : `Bet on ${homeTeam}`;
    } else {
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