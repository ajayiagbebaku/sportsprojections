import axios from 'axios';
import { formatApiDate } from './dateUtils';
import { getTeamCode } from './teamMapping';

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const api = axios.create({
  baseURL: 'https://tank01-fantasy-stats.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': API_HOST
  }
});

export async function fetchNBAOdds(date: string) {
  try {
    const formattedDate = formatApiDate(date);
    console.log('\n=== Fetching NBA Odds ===');
    console.log('Formatted date for API:', formattedDate);

    const response = await api.get('/getNBABettingOdds', {
      params: {
        gameDate: formattedDate,
        itemFormat: 'list'
      }
    });

    console.log('API Response:', {
      status: response.status,
      statusCode: response.data?.statusCode,
      gamesCount: Object.keys(response.data?.body || {}).length
    });

    if (!response.data?.body) {
      console.log('No odds data in response');
      return null;
    }

    const processedGames = {};
    for (const [gameId, game] of Object.entries(response.data.body)) {
      console.log(`Processing game ${gameId}`);
      
      const fanduelBook = game.sportsBooks?.find(book => 
        book.sportsBook.toLowerCase() === 'fanduel'
      );

      if (!fanduelBook?.odds) {
        console.log('No FanDuel odds for game:', gameId);
        continue;
      }

      const homeTeamCode = getTeamCode(game.homeTeam);
      const awayTeamCode = getTeamCode(game.awayTeam);

      if (!homeTeamCode || !awayTeamCode) {
        console.log('Invalid team codes:', { home: game.homeTeam, away: game.awayTeam });
        continue;
      }

      processedGames[gameId] = {
        ...game,
        team_id_home: homeTeamCode,
        team_id_away: awayTeamCode,
        odds: {
          spread_home: parseFloat(fanduelBook.odds.homeTeamSpread),
          total: parseFloat(fanduelBook.odds.totalOver),
          home_moneyline: parseInt(fanduelBook.odds.homeTeamMLOdds),
          away_moneyline: parseInt(fanduelBook.odds.awayTeamMLOdds)
        }
      };

      console.log('Processed odds:', {
        gameId,
        spread: processedGames[gameId].odds.spread_home,
        total: processedGames[gameId].odds.total
      });
    }

    return processedGames;
  } catch (error) {
    console.error('Error fetching odds:', error);
    throw error;
  }
}

export async function fetchNBASchedule(date: string) {
  try {
    const formattedDate = formatApiDate(date);
    console.log('\n=== Fetching NBA Schedule ===');
    console.log('Formatted date for API:', formattedDate);

    const response = await api.get('/getNBAGamesForDate', {
      params: { gameDate: formattedDate }
    });

    if (!response.data?.body || !Array.isArray(response.data.body)) {
      console.log('No games found for date:', formattedDate);
      return [];
    }

    console.log(`Found ${response.data.body.length} games`);
    return response.data.body;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}