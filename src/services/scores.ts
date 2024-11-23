import axios from 'axios';
import { format } from 'date-fns';
import { updateGameResults } from './supabase';

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

interface GameScore {
  gameID: string;
  away: string;
  home: string;
  awayPts: string;
  homePts: string;
  gameStatus: string;
}

export async function fetchAndUpdateScores(date: Date) {
  try {
    const formattedDate = format(date, 'yyyyMMdd');
    
    const response = await axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBAScoresOnly', {
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

    if (!response.data?.body) {
      throw new Error('Invalid API response format');
    }

    const games = Object.values(response.data.body) as GameScore[];
    
    // Update results for completed games
    for (const game of games) {
      if (game.gameStatus === 'Completed') {
        await updateGameResults(
          game.gameID,
          parseInt(game.homePts),
          parseInt(game.awayPts)
        );
      }
    }

    return games;
  } catch (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }
}