import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface TeamStats {
  team_name: string;
  team_code: string;
  ppg: number;
  oppg: number;
  pace: number;
}

export async function generatePrediction(
  homeTeam: string,
  awayTeam: string,
  fanduelSpreadHome: number,
  fanduelTotal: number,
  isPlayoffs: boolean = false
) {
  try {
    // Fetch team stats from database
    const { data: teams, error } = await supabase
      .from('team_stats')
      .select('*')
      .in('team_name', [homeTeam, awayTeam]);

    if (error) throw error;
    if (!teams || teams.length !== 2) {
      throw new Error(`Stats not found for ${homeTeam} or ${awayTeam}`);
    }

    const homeStats = teams.find(t => t.team_name === homeTeam);
    const awayStats = teams.find(t => t.team_name === awayTeam);

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
  } catch (error) {
    console.error('Error generating prediction:', error);
    throw error;
  }
}