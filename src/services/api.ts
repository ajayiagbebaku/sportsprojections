import axios from 'axios';
import { format } from 'date-fns';
import { generatePrediction } from './statsService';
import { savePrediction, getPredictions } from './supabase';
import type { GamePrediction } from '../types';

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

// Create axios instance based on environment
const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? 'https://tank01-fantasy-stats.p.rapidapi.com'
    : 'http://localhost:3001/api',
  headers: import.meta.env.PROD ? {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': API_HOST,
  } : {}
});

export async function fetchNBAOdds(dateString: string): Promise<GamePrediction[]> {
  try {
    // First try to get predictions from Supabase
    const cachedPredictions = await getPredictions(dateString);
    if (cachedPredictions.length > 0) {
      console.log('Using cached predictions for:', dateString);
      return cachedPredictions;
    }

    // If no cached data, fetch from API
    const formattedDate = format(new Date(dateString), 'yyyyMMdd');
    console.log('Fetching fresh data for date:', formattedDate);
    
    // Fetch odds and scores
    const [oddsResponse, scoresResponse] = await Promise.all([
      import.meta.env.PROD
        ? api.get('/getNBABettingOdds', { 
            params: { 
              gameDate: formattedDate,
              itemFormat: 'list'
            }
          })
        : api.get('/odds', { 
            params: { 
              gameDate: formattedDate 
            }
          }),
      import.meta.env.PROD
        ? api.get('/getNBAScoresOnly', {
            params: {
              gameDate: formattedDate,
              topPerformers: 'false',
              lineups: 'false'
            }
          })
        : api.get('/scores', { 
            params: { 
              gameDate: formattedDate 
            }
          })
    ]);

    if (!oddsResponse.data?.body || typeof oddsResponse.data.body !== 'object') {
      console.log('No games found for date:', formattedDate);
      return [];
    }

    const games = oddsResponse.data.body;
    const scores = scoresResponse.data?.body || {};
    const predictions: GamePrediction[] = [];

    for (const [gameId, game] of Object.entries(games)) {
      try {
        const homeTeamKey = teamCodeMapping[game.homeTeam];
        const awayTeamKey = teamCodeMapping[game.awayTeam];

        if (!homeTeamKey || !awayTeamKey) {
          console.warn(`Unknown team mapping for ${game.homeTeam} or ${game.awayTeam}`);
          continue;
        }

        const fanduelBook = game.sportsBooks?.find((book: any) => 
          book.sportsBook.toLowerCase() === 'fanduel'
        );
        
        if (!fanduelBook?.odds) {
          console.warn('No FanDuel odds found for game', gameId);
          continue;
        }

        const fanduelOdds = fanduelBook.odds;
        const fanduelSpreadHome = parseFloat(fanduelOdds.homeTeamSpread);
        const fanduelTotal = parseFloat(fanduelOdds.totalOver);
        const homeTeamMoneyline = parseInt(fanduelOdds.homeTeamMLOdds);
        const awayTeamMoneyline = parseInt(fanduelOdds.awayTeamMLOdds);

        if (isNaN(fanduelSpreadHome) || isNaN(fanduelTotal)) {
          console.warn('Invalid odds values for game', gameId);
          continue;
        }

        // Get actual scores if game is completed
        const gameScore = scores[gameId];
        const actualHomeScore = gameScore?.homePts ? parseInt(gameScore.homePts) : undefined;
        const actualAwayScore = gameScore?.awayPts ? parseInt(gameScore.awayPts) : undefined;
        const gameStatus = gameScore?.gameStatus || (gameScore?.gameClock === 'Final' ? 'Completed' : undefined);

        // Generate prediction using database stats
        const prediction = await generatePrediction(
          homeTeamKey,
          awayTeamKey,
          fanduelSpreadHome,
          fanduelTotal
        );

        // Save prediction to Supabase
        await savePrediction({
          game_id: gameId,
          game_date: dateString,
          home_team: homeTeamKey,
          away_team: awayTeamKey,
          predicted_home_score: prediction.homeScore,
          predicted_away_score: prediction.awayScore,
          predicted_total: prediction.totalScore,
          fanduel_spread_home: fanduelSpreadHome,
          fanduel_total: fanduelTotal,
          actual_home_score: actualHomeScore,
          actual_away_score: actualAwayScore,
          spread_result: prediction.spreadResult,
          total_result: prediction.totalResult
        });

        predictions.push({
          gameId,
          homeTeam: homeTeamKey,
          awayTeam: awayTeamKey,
          homeScore: prediction.homeScore,
          awayScore: prediction.awayScore,
          totalScore: prediction.totalScore,
          suggestedBet: prediction.suggestedBet,
          overUnder: prediction.overUnder,
          fanduelSpreadHome,
          fanduelTotal,
          homeTeamMoneyline,
          awayTeamMoneyline,
          actualHomeScore,
          actualAwayScore,
          gameStatus,
          spreadResult: prediction.spreadResult,
          totalResult: prediction.totalResult
        });

      } catch (error) {
        console.error(`Error processing game ${gameId}:`, error);
      }
    }

    return predictions;
  } catch (error) {
    console.error('Error fetching NBA data:', error);
    throw new Error('Failed to fetch game data. Please try again later.');
  }
}

// Map API team codes to database team names
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