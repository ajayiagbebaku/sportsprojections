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
}

export interface TeamStats {
  team: string;
  ppg: number;
  oppg: number;
  pace: number;
}