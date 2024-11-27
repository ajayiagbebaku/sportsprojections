export interface TeamStats {
  team_id: string;
  team_code: string;
  team_name: string;
  ppg: number;
  oppg: number;
  pace: number;
}

export interface GamePrediction {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  totalScore: number;
  projectedSpread: number;
  fanduelSpreadHome?: number;
  fanduelTotal?: number;
  homeTeamMoneyline?: number;
  awayTeamMoneyline?: number;
  actualHomeScore?: number;
  actualAwayScore?: number;
  gameStatus?: string;
  spreadResult?: 'win' | 'loss' | 'push';
  totalResult?: 'win' | 'loss' | 'push';
  suggestedBet: string;
  overUnder: string;
}