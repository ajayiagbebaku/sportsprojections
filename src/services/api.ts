import axios from 'axios';
import { format } from 'date-fns';
import type { GamePrediction } from '../types';
import { generatePrediction } from './statsService';

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const api = axios.create({
  baseURL: 'https://tank01-fantasy-stats.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': API_HOST,
  },
});

// Map API team codes to the format used in teamStats
const teamCodeMapping: Record<string, string> = {
  'ATL': 'Atlanta',
  'BOS': 'Boston',
  'BKN': 'Brooklyn',
  'BRK': 'Brooklyn',
  'CHA': 'Charlotte',
  'CHI': 'Chicago',
  'CLE': 'Cleveland',
  'DAL': 'Dallas',
  'DEN': 'Denver',
  'DET': 'Detroit',
  'GSW': 'Golden State',
  'GS': 'Golden State',
  'HOU': 'Houston',
  'IND': 'Indiana',
  'LAC': 'LA Clippers',
  'LAL': 'LA Lakers',
  'MEM': 'Memphis',
  'MIA': 'Miami',
  'MIL': 'Milwaukee',
  'MIN': 'Minnesota',
  'NOP': 'New Orleans',
  'NO': 'New Orleans',
  'NYK': 'New York',
  'NY': 'New York',
  'OKC': 'Oklahoma City',
  'ORL': 'Orlando',
  'PHI': 'Philadelphia',
  'PHX': 'Phoenix',
  'POR': 'Portland',
  'SAC': 'Sacramento',
  'SAS': 'San Antonio',
  'SA': 'San Antonio',
  'TOR': 'Toronto',
  'UTA': 'Utah',
  'WAS': 'Washington'
};

// Map team codes to full display names
const teamDisplayNames: Record<string, string> = {
  'ATL': 'Atlanta Hawks',
  'BOS': 'Boston Celtics',
  'BKN': 'Brooklyn Nets',
  'BRK': 'Brooklyn Nets',
  'CHA': 'Charlotte Hornets',
  'CHI': 'Chicago Bulls',
  'CLE': 'Cleveland Cavaliers',
  'DAL': 'Dallas Mavericks',
  'DEN': 'Denver Nuggets',
  'DET': 'Detroit Pistons',
  'GSW': 'Golden State Warriors',
  'GS': 'Golden State Warriors',
  'HOU': 'Houston Rockets',
  'IND': 'Indiana Pacers',
  'LAC': 'LA Clippers',
  'LAL': 'LA Lakers',
  'MEM': 'Memphis Grizzlies',
  'MIA': 'Miami Heat',
  'MIL': 'Milwaukee Bucks',
  'MIN': 'Minnesota Timberwolves',
  'NOP': 'New Orleans Pelicans',
  'NO': 'New Orleans Pelicans',
  'NYK': 'New York Knicks',
  'NY': 'New York Knicks',
  'OKC': 'Oklahoma City Thunder',
  'ORL': 'Orlando Magic',
  'PHI': 'Philadelphia 76ers',
  'PHX': 'Phoenix Suns',
  'POR': 'Portland Trail Blazers',
  'SAC': 'Sacramento Kings',
  'SAS': 'San Antonio Spurs',
  'SA': 'San Antonio Spurs',
  'TOR': 'Toronto Raptors',
  'UTA': 'Utah Jazz',
  'WAS': 'Washington Wizards'
};

function findFanduelOdds(game: any): any {
  // First check if there's a direct fanduel property
  if (game.fanduel) {
    return game.fanduel;
  }

  // Then check the sportsBooks array
  if (Array.isArray(game.sportsBooks)) {
    const fanduelBook = game.sportsBooks.find((book: any) => 
      book.sportsBook?.toLowerCase() === "fanduel" || 
      book.sportsbook?.toLowerCase() === "fanduel"
    );
    if (fanduelBook?.odds) {
      return fanduelBook.odds;
    }
  }

  // If no FanDuel odds found, try to get odds from any available sportsbook
  if (Array.isArray(game.sportsBooks) && game.sportsBooks.length > 0) {
    const firstBook = game.sportsBooks[0];
    if (firstBook?.odds) {
      console.log(`Using ${firstBook.sportsBook} odds for game ${game.gameID}`);
      return firstBook.odds;
    }
  }

  return null;
}

function parseMoneylineOdds(odds: string): number {
  if (!odds) return 0;
  // Remove any '+' prefix and convert to number
  return parseInt(odds.replace(/[^-\d]/g, ''));
}

export async function fetchNBAOdds(gameDate: string): Promise<GamePrediction[]> {
  try {
    console.log('Fetching odds for date:', gameDate);
    const response = await api.get('/getNBABettingOdds', {
      params: { gameDate }
    });

    if (!response.data?.body) {
      throw new Error('Invalid API response format');
    }

    const predictions: GamePrediction[] = [];
    const games = Object.values(response.data.body);

    for (const [index, game] of games.entries()) {
      try {
        const homeTeamCode = game.homeTeam;
        const awayTeamCode = game.awayTeam;
        
        // Get the team names for stats lookup
        const homeTeamStats = teamCodeMapping[homeTeamCode];
        const awayTeamStats = teamCodeMapping[awayTeamCode];
        
        if (!homeTeamStats || !awayTeamStats) {
          console.warn(`Unknown team mapping for ${homeTeamCode} or ${awayTeamCode}`);
          continue;
        }

        // Find odds from FanDuel or fallback to another sportsbook
        const odds = findFanduelOdds(game);
        if (!odds) {
          console.warn(`No odds found for game ${game.gameID}`);
          continue;
        }

        // Parse odds values, ensuring we handle both string and number formats
        const homeTeamSpread = parseFloat(odds.homeTeamSpread || '0');
        const totalOver = parseFloat(odds.totalOver || '0');
        const homeTeamMoneyline = parseMoneylineOdds(odds.homeTeamMLOdds);
        const awayTeamMoneyline = parseMoneylineOdds(odds.awayTeamMLOdds);

        const prediction = generatePrediction(
          homeTeamStats,
          awayTeamStats,
          homeTeamSpread,
          totalOver,
          false // isPlayoffs flag
        );

        predictions.push({
          gameId: game.gameID,
          homeTeam: teamDisplayNames[homeTeamCode] || homeTeamCode,
          awayTeam: teamDisplayNames[awayTeamCode] || awayTeamCode,
          ...prediction,
          fanduelSpreadHome: homeTeamSpread,
          fanduelTotal: totalOver,
          homeTeamMoneyline,
          awayTeamMoneyline
        });
      } catch (err) {
        console.error(`Error generating prediction for game ${index}:`, err);
      }
    }

    if (predictions.length === 0) {
      throw new Error('No valid predictions could be generated');
    }

    return predictions;
  } catch (error) {
    console.error('Error fetching NBA odds:', error);
    throw new Error('Failed to fetch game data. Please try again later.');
  }
}