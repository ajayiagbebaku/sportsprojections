export interface TeamStats {
  team_id: string;
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
}