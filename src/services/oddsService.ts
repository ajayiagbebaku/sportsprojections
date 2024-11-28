import { supabase } from './supabase';
import { fetchNBAOdds } from './nbaApi';
import { getTeamCode } from './teamMapping';
import { formatApiDate } from './dateUtils';

export async function fetchAndSaveOdds(date: string) {
  try {
    console.log('\n=== Fetching and Saving Odds ===');
    console.log('Input date:', date);

    // First get scheduled games for the date to match IDs
    const { data: scheduledGames, error: scheduleError } = await supabase
      .from('nba_schedule')
      .select('*')
      .eq('game_date', date);

    if (scheduleError) {
      console.error('Error fetching scheduled games:', scheduleError);
      throw scheduleError;
    }

    if (!scheduledGames?.length) {
      console.log('No scheduled games found for date:', date);
      return [];
    }

    console.log(`Found ${scheduledGames.length} scheduled games`);

    // Fetch odds from API
    const response = await fetchNBAOdds(date);
    if (!response) {
      console.log('No odds data returned from API');
      return [];
    }

    const odds = [];
    for (const [gameId, game] of Object.entries(response)) {
      console.log(`\nProcessing odds for game: ${gameId}`);
      
      // Find matching scheduled game
      const scheduledGame = scheduledGames.find(g => 
        g.team_id_home === game.team_id_home && 
        g.team_id_away === game.team_id_away
      );

      if (!scheduledGame) {
        console.log('No matching scheduled game found for:', {
          homeTeam: game.team_id_home,
          awayTeam: game.team_id_away
        });
        continue;
      }

      console.log('Found matching scheduled game:', scheduledGame.game_id);

      const oddsRecord = {
        game_id: scheduledGame.game_id,
        game_date: date,
        spread_home: game.odds.spread_home,
        total: game.odds.total,
        home_moneyline: game.odds.home_moneyline,
        away_moneyline: game.odds.away_moneyline
      };

      // Validate numbers
      if (isNaN(oddsRecord.spread_home) || isNaN(oddsRecord.total)) {
        console.warn('Invalid odds values:', oddsRecord);
        continue;
      }

      // Save to database
      const { error } = await supabase
        .from('game_odds')
        .upsert(oddsRecord, {
          onConflict: 'game_id',
          returning: 'minimal'
        });

      if (error) {
        console.error(`Error saving odds for game ${scheduledGame.game_id}:`, error);
        continue;
      }

      odds.push(oddsRecord);
      console.log(`Saved odds for game ${scheduledGame.game_id}:`, {
        spread: oddsRecord.spread_home,
        total: oddsRecord.total
      });
    }

    console.log(`\nProcessed and saved odds for ${odds.length} games`);
    return odds;
  } catch (error) {
    console.error('Error in fetchAndSaveOdds:', error);
    throw error;
  }
}