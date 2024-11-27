import { supabase } from './supabase';
import { normalizeDate } from './dateUtils';

export async function getScheduledGames(date: string) {
  try {
    const normalizedDate = normalizeDate(date);
    console.log('Getting scheduled games for:', normalizedDate);
    
    const { data: games, error } = await supabase
      .from('nba_schedule')
      .select('*')
      .eq('game_date', normalizedDate);

    if (error) {
      console.error('Error fetching schedule:', error);
      throw error;
    }

    if (!games?.length) {
      console.log('No games found for date:', normalizedDate);
      return [];
    }

    console.log(`Found ${games.length} games for ${normalizedDate}`);
    return games;
  } catch (error) {
    console.error('Error in getScheduledGames:', error);
    throw error;
  }
}