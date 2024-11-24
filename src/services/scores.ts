import axios from 'axios';
import { format, subDays } from 'date-fns';
import { updateGameResults } from './supabase';

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

interface GameScore {
  away: string;
  home: string;
  teamIDAway: string;
  teamIDHome: string;
  gameID: string;
  awayPts: string;
  homePts: string;
  gameClock: string;
  gameStatus: string;
}

interface APIResponse {
  statusCode: number;
  body: Record<string, GameScore>;
}

export async function fetchAndUpdateScores(currentDate: Date) {
  try {
    const previousDay = subDays(currentDate, 1);
    const formattedDate = format(previousDay, 'yyyyMMdd');
    console.log('Checking scores for previous day:', formattedDate);
    
    const response = await axios.get<APIResponse>('https://tank01-fantasy-stats.p.rapidapi.com/getNBAScoresOnly', {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST,
      },
      params: {
        gameDate: formattedDate,
        topPerformers: 'false',
        lineups: 'false'
      }
    });

    if (!response.data?.body || response.data.statusCode !== 200) {
      console.log('No games found or invalid response for date:', formattedDate);
      return [];
    }

    const games = Object.values(response.data.body);
    console.log(`Found ${games.length} games for ${formattedDate}`);
    
    // Update results for completed games
    for (const game of games) {
      console.log(`Processing game ${game.gameID}:`, game);
      
      // Only process completed games
      if (game.gameStatus === 'Completed' || game.gameClock === 'Final') {
        console.log(`Updating results for completed game: ${game.gameID}`);
        const homePts = parseInt(game.homePts);
        const awayPts = parseInt(game.awayPts);
        
        if (!isNaN(homePts) && !isNaN(awayPts)) {
          try {
            await updateGameResults(
              game.gameID,
              homePts,
              awayPts
            );
            console.log(`Successfully updated results for game ${game.gameID}`);
          } catch (error) {
            console.error(`Error updating results for game ${game.gameID}:`, error);
          }
        } else {
          console.warn(`Invalid score data for game ${game.gameID}: home=${game.homePts}, away=${game.awayPts}`);
        }
      } else {
        console.log(`Skipping non-completed game ${game.gameID} (status: ${game.gameStatus}, clock: ${game.gameClock})`);
      }
    }

    return games;
  } catch (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }
}