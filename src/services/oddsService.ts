import { supabase } from './supabase';
import { normalizeDate } from './dateUtils';
import axios from 'axios';

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

export async function getGameOdds(date: string, gameIds: string[]) {
  try {
    const normalizedDate = normalizeDate(date);
    console.log('Getting odds for games:', gameIds);

    // First check existing odds in database
    const { data: existingOdds, error: existingError } = await supabase
      .from('game_odds')
      .select('*')
      .in('game_id', gameIds);

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
    const formattedDate = normalizedDate.replace(/-/g, '');
    
    const response = await axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBABettingOdds', {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST
      },
      params: {
        gameDate: formattedDate,
        itemFormat: 'list'
      }
    });

    if (!response.data?.body) {
      console.log('No odds found from API');
      return [];
    }

    const odds = [];
    for (const [gameId, game] of Object.entries(response.data.body)) {
      // Only process odds for games we're interested in
      if (!gameIds.includes(gameId)) continue;

      const fanduelBook = game.sportsBooks?.find(book => 
        book.sportsBook.toLowerCase() === 'fanduel'
      );
      
      if (!fanduelBook?.odds) {
        console.warn('No FanDuel odds found for game', gameId);
        continue;
      }

      const oddsRecord = {
        game_id: gameId,
        game_date: normalizedDate,
        spread_home: parseFloat(fanduelBook.odds.homeTeamSpread),
        total: parseFloat(fanduelBook.odds.totalOver),
        home_moneyline: parseInt(fanduelBook.odds.homeTeamMLOdds),
        away_moneyline: parseInt(fanduelBook.odds.awayTeamMLOdds)
      };

      // Validate numbers before saving
      if (isNaN(oddsRecord.spread_home) || isNaN(oddsRecord.total) || 
          isNaN(oddsRecord.home_moneyline) || isNaN(oddsRecord.away_moneyline)) {
        console.warn('Invalid odds values for game', gameId);
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
        console.error(`Error saving odds for game ${gameId}:`, error);
        continue;
      }

      odds.push(oddsRecord);
      console.log(`Saved odds for game ${gameId}`);
    }

    console.log(`Saved odds for ${odds.length} games`);
    return odds;
  } catch (error) {
    console.error('Error in getGameOdds:', error);
    throw error;
  }
}