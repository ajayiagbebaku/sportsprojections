export interface GamePrediction {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  totalScore: number;
  suggestedBet: string;
  overUnder: string;
  fanduelSpreadHome: number;
  fanduelTotal: number;
  homeTeamMoneyline: number;
  awayTeamMoneyline: number;
  actualHomeScore?: number;
  actualAwayScore?: number;
  gameStatus?: string;
  spreadResult?: 'win' | 'loss' | 'push';
  totalResult?: 'win' | 'loss' | 'push';
}