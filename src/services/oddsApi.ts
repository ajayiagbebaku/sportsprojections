import axios from 'axios';
import { formatApiDate } from './dateUtils';
import { supabase } from './supabase';

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

interface APIResponse {
  statusCode: number;
  body: Record<string, {
    homeTeam: string;
    awayTeam: string;
    sportsBooks: Array<{
      sportsBook: string;
      odds: {
        homeTeamSpread: string;
        totalOver: string;
        homeTeamMLOdds: string;
        awayTeamMLOdds: string;
      };
    }>;
  }>;
}

// Team code mapping to ensure consistency
const teamCodeMapping = {
  'ATL': 'ATL',
  'BOS': 'BOS',
  'BKN': 'BKN',
  'CHA': 'CHA',
  'CHI': 'CHI',
  'CLE': 'CLE',
  'DAL': 'DAL',
  'DEN': 'DEN',
  'DET': 'DET',
  'GSW': 'GSW',
  'HOU': 'HOU',
  'IND': 'IND',
  'LAC': 'LAC',
  'LAL': 'LAL',
  'MEM': 'MEM',
  'MIA': 'MIA',
  'MIL': 'MIL',
  'MIN': 'MIN',
  'NOP': 'NOP',
  'NYK': 'NYK',
  'OKC': 'OKC',
  'ORL': 'ORL',
  'PHI': 'PHI',
  'PHX': 'PHX',
  'POR': 'POR',
  'SAC': 'SAC',
  'SAS': 'SAS',
  'TOR': 'TOR',
  'UTA': 'UTA',
  'WAS': 'WAS',
  // Handle any variations
  'BRK': 'BKN',
  'GS': 'GSW',
  'NO': 'NOP',
  'NY': 'NYK',
  'SA': 'SAS'
};

export async function fetchAndSaveOdds(date: string) {
  try {
    const formattedDate = formatApiDate(date);
    console.log('Fetching odds from API for date:', formattedDate);

    const response = await axios.get<APIResponse>('https://tank01-fantasy-stats.p.rapidapi.com/getNBABettingOdds', {
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
      console.log('No odds found for date:', formattedDate);
      return [];
    }

    const odds = [];
    for (const [gameId, game] of Object.entries(response.data.body)) {
      const homeCode = teamCodeMapping[game.homeTeam];
      const awayCode = teamCodeMapping[game.awayTeam];

      if (!homeCode || !awayCode) {
        console.warn(`Invalid team code mapping for game: ${game.homeTeam} vs ${game.awayTeam}`);
        continue;
      }

      const fanduelBook = game.sportsBooks?.find(book => 
        book.sportsBook.toLowerCase() === 'fanduel'
      );
      
      if (!fanduelBook?.odds) {
        console.warn('No FanDuel odds found for game', gameId);
        continue;
      }

      const oddsRecord = {
        game_id: gameId,
        game_date: date,
        team_id_home: homeCode,
        team_id_away: awayCode,
        spread_home: parseFloat(fanduelBook.odds.homeTeamSpread),
        total: parseFloat(fanduelBook.odds.totalOver),
        home_moneyline: parseInt(fanduelBook.odds.homeTeamMLOdds),
        away_moneyline: parseInt(fanduelBook.odds.awayTeamMLOdds)
      };

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
    }

    console.log(`Saved odds for ${odds.length} games`);
    return odds;
  } catch (error) {
    console.error('Error fetching odds:', error);
    throw error;
  }
}