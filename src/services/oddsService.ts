import { supabase } from './supabase';
import { fetchAndSaveOdds } from './oddsApi';
import { normalizeDate } from './dateUtils';

export async function getGameOdds(date: string, gameIds: string[]) {
  try {
    const normalizedDate = normalizeDate(date);
    console.log('Getting odds for games:', gameIds);

    // First check existing odds in database
    const { data: existingOdds, error: existingError } = await supabase
      .from('game_odds')
      .select('*')
      .in('game_id', gameIds)
      .eq('game_date', normalizedDate);

    if (existingError) {
      console.error('Error fetching existing odds:', existingError);
      throw existingError;
    }

    // If we have all odds, return them
    if (existingOdds?.length === gameIds.length) {
      console.log('Using existing odds from database');
      return existingOdds;
    }

    // Fetch fresh odds from API
    console.log('Fetching fresh odds from API');
    const freshOdds = await fetchAndSaveOdds(normalizedDate);
    
    // Filter for requested games
    const gameOdds = freshOdds.filter(odd => gameIds.includes(odd.game_id));
    console.log(`Found odds for ${gameOdds.length} out of ${gameIds.length} games`);
    
    return gameOdds;
  } catch (error) {
    console.error('Error in getGameOdds:', error);
    throw error;
  }
}