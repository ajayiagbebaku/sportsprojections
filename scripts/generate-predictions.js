import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generatePrediction(homeTeam, awayTeam, fanduelSpreadHome, fanduelTotal) {
  try {
    // Fetch team stats from database
    const { data: teams, error: teamsError } = await supabase
      .from('team_stats')
      .select('*')
      .in('team_name', [homeTeam, awayTeam]);

    if (teamsError) throw teamsError;
    if (!teams || teams.length !== 2) {
      throw new Error(`Stats not found for ${homeTeam} or ${awayTeam}`);
    }

    const homeStats = teams.find(t => t.team_name === homeTeam);
    const awayStats = teams.find(t => t.team_name === awayTeam);

    // Calculate base scores
    let homeScore = (homeStats.ppg + awayStats.oppg) / 2;
    let awayScore = (awayStats.ppg + homeStats.oppg) / 2;

    // Pace adjustment
    const paceAdjustment = (homeStats.pace + awayStats.pace) / 200;
    homeScore *= paceAdjustment;
    awayScore *= paceAdjustment;

    // Home court advantage
    homeScore += 3.5;

    return {
      homeScore: Math.round(homeScore),
      awayScore: Math.round(awayScore),
      totalScore: Math.round(homeScore + awayScore),
      projectedSpread: Math.round(homeScore - awayScore)
    };
  } catch (error) {
    console.error('Error generating prediction:', error);
    throw error;
  }
}

async function processGamesForDate(date) {
  const formattedDate = format(date, 'yyyy-MM-dd');
  console.log(`Processing games for ${formattedDate}`);

  try {
    // Get games that need predictions
    const { data: games, error: gamesError } = await supabase
      .from('game_scores')
      .select('*')
      .eq('game_date', formattedDate)
      .is('prediction_generated', false);

    if (gamesError) throw gamesError;
    if (!games || games.length === 0) {
      console.log('No new games to process');
      return;
    }

    console.log(`Found ${games.length} games to process`);

    for (const game of games) {
      try {
        // Get odds for the game
        const { data: odds, error: oddsError } = await supabase
          .from('game_odds')
          .select('*')
          .eq('game_id', game.game_id)
          .single();

        if (oddsError) {
          console.warn(`No odds found for game ${game.game_id}`);
          continue;
        }

        // Generate prediction
        const prediction = await generatePrediction(
          game.home_team,
          game.away_team,
          odds.spread_home,
          odds.total
        );

        // Save prediction
        const { error: saveError } = await supabase
          .from('predictions')
          .upsert({
            game_id: game.game_id,
            game_date: formattedDate,
            home_team: game.home_team,
            away_team: game.away_team,
            predicted_home_score: prediction.homeScore,
            predicted_away_score: prediction.awayScore,
            predicted_total: prediction.totalScore,
            fanduel_spread_home: odds.spread_home,
            fanduel_total: odds.total,
            actual_home_score: game.home_score,
            actual_away_score: game.away_score,
            game_status: game.game_status
          });

        if (saveError) {
          console.error(`Error saving prediction for game ${game.game_id}:`, saveError);
          continue;
        }

        // Mark game as processed
        await supabase
          .from('game_scores')
          .update({ prediction_generated: true })
          .eq('game_id', game.game_id);

        console.log(`Successfully processed game ${game.game_id}`);
      } catch (error) {
        console.error(`Error processing game ${game.game_id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing games:', error);
    throw error;
  }
}

// Run the processor
processGamesForDate(new Date())
  .then(() => {
    console.log('Processing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Processing failed:', error);
    process.exit(1);
  });