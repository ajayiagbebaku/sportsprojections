import axios from 'axios';
import { format, subDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import { generatePrediction } from './statsService.js';

const DAYS_TO_BACKFILL = 7;
const MAX_RETRIES = 5;
const RETRY_DELAY = 1000;
const RATE_LIMIT_DELAY = 500;

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const api = axios.create({
  baseURL: 'https://tank01-fantasy-stats.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': API_HOST,
  }
});

const supabase = createClient(
  'https://yjebzlvsjonvxfpcuwaa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU'
);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const teamCodeMapping = {
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

async function fetchWithRetry(url, params, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) {
        console.log(`Retry attempt ${i + 1} for ${url}`);
        await sleep(RETRY_DELAY * Math.pow(2, i));
      }
      
      const response = await api.get(url, { params });
      
      if (response.data?.statusCode === 200 || response.data?.body) {
        return response.data;
      }
      
      console.warn(`Invalid response from ${url}, attempt ${i + 1}/${retries}`);
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('Rate limited, waiting longer...');
        await sleep(RETRY_DELAY * Math.pow(2, i) * 2);
        continue;
      }
      
      if (i < retries - 1) {
        await sleep(RETRY_DELAY * Math.pow(2, i));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}

function determineSpreadResult(predictedSpread, actualSpread, fanduelSpread) {
  if (actualSpread === fanduelSpread) return 'push';
  
  if (fanduelSpread < 0) {
    const predictedCovers = predictedSpread < fanduelSpread;
    const actualCovers = actualSpread < fanduelSpread;
    return predictedCovers === actualCovers ? 'win' : 'loss';
  } else {
    const predictedCovers = predictedSpread > -fanduelSpread;
    const actualCovers = actualSpread > -fanduelSpread;
    return predictedCovers === actualCovers ? 'win' : 'loss';
  }
}

function determineTotalResult(predictedTotal, actualTotal, totalLine) {
  if (actualTotal === totalLine) return 'push';
  
  const predictedOver = predictedTotal > totalLine;
  const actualOver = actualTotal > totalLine;
  return predictedOver === actualOver ? 'win' : 'loss';
}

async function processGame(gameId, game, scores, date) {
  try {
    const homeTeamKey = teamCodeMapping[game.homeTeam];
    const awayTeamKey = teamCodeMapping[game.awayTeam];

    if (!homeTeamKey || !awayTeamKey) {
      console.warn(`Unknown team mapping for ${game.homeTeam} or ${game.awayTeam}`);
      return;
    }

    const fanduelBook = game.sportsBooks?.find(book => 
      book.sportsBook.toLowerCase() === 'fanduel'
    );
    
    if (!fanduelBook?.odds) {
      console.warn('No FanDuel odds found for game', gameId);
      return;
    }

    const fanduelOdds = fanduelBook.odds;
    const fanduelSpreadHome = parseFloat(fanduelOdds.homeTeamSpread);
    const fanduelTotal = parseFloat(fanduelOdds.totalOver);
    const homeMoneyline = parseInt(fanduelOdds.homeTeamMLOdds);
    const awayMoneyline = parseInt(fanduelOdds.awayTeamMLOdds);

    if (isNaN(fanduelSpreadHome) || isNaN(fanduelTotal)) {
      console.warn('Invalid odds values for game', gameId);
      return;
    }

    const prediction = generatePrediction(
      homeTeamKey,
      awayTeamKey,
      fanduelSpreadHome,
      fanduelTotal
    );

    const gameScore = scores[gameId];
    const actualHomeScore = gameScore?.homePts ? parseInt(gameScore.homePts) : null;
    const actualAwayScore = gameScore?.awayPts ? parseInt(gameScore.awayPts) : null;
    const gameStatus = gameScore?.gameStatus || (gameScore?.gameClock === 'Final' ? 'Completed' : null);

    let spreadResult = null;
    let totalResult = null;

    if (actualHomeScore !== null && actualAwayScore !== null) {
      const actualSpread = actualHomeScore - actualAwayScore;
      const actualTotal = actualHomeScore + actualAwayScore;
      
      spreadResult = determineSpreadResult(
        prediction.homeScore - prediction.awayScore,
        actualSpread,
        fanduelSpreadHome
      );
      
      totalResult = determineTotalResult(
        prediction.totalScore,
        actualTotal,
        fanduelTotal
      );
    }

    await supabase
      .from('predictions')
      .upsert({
        game_id: gameId,
        game_date: date,
        home_team: homeTeamKey,
        away_team: awayTeamKey,
        predicted_home_score: prediction.homeScore,
        predicted_away_score: prediction.awayScore,
        predicted_total: prediction.totalScore,
        fanduel_spread_home: fanduelSpreadHome,
        fanduel_total: fanduelTotal,
        home_moneyline: homeMoneyline,
        away_moneyline: awayMoneyline,
        actual_home_score: actualHomeScore,
        actual_away_score: actualAwayScore,
        spread_result: spreadResult,
        total_result: totalResult,
        game_status: gameStatus
      });

    console.log(`Processed game ${gameId}`);
  } catch (error) {
    console.error(`Error processing game ${gameId}:`, error);
    throw error;
  }
}

async function fetchDataForDate(date) {
  const formattedDate = format(date, 'yyyyMMdd');
  const isoDate = format(date, 'yyyy-MM-dd');
  
  console.log(`\n=== Processing ${isoDate} ===`);

  try {
    const [oddsData, scoresData] = await Promise.all([
      fetchWithRetry('/getNBABettingOdds', {
        gameDate: formattedDate,
        itemFormat: 'list'
      }),
      fetchWithRetry('/getNBAScoresOnly', {
        gameDate: formattedDate,
        topPerformers: 'false',
        lineups: 'false'
      })
    ]);

    const games = oddsData?.body || {};
    const scores = scoresData?.body || {};

    const gameCount = Object.keys(games).length;
    console.log(`Found ${gameCount} games for ${isoDate}`);
    
    if (gameCount === 0) {
      console.log('No games found for this date');
      return;
    }

    let processedCount = 0;
    for (const [gameId, game] of Object.entries(games)) {
      try {
        console.log(`\n[${++processedCount}/${gameCount}] Processing game ${gameId}...`);
        await processGame(gameId, game, scores, isoDate);
        
        if (processedCount < gameCount) {
          await sleep(RATE_LIMIT_DELAY);
        }
      } catch (error) {
        console.error(`Error processing game ${gameId}:`, error);
      }
    }

    console.log(`\n✅ Completed processing ${processedCount} games for ${isoDate}`);
  } catch (error) {
    console.error(`Error processing date ${isoDate}:`, error);
    throw error;
  }
}

async function backfillData() {
  console.log(`Starting backfill for last ${DAYS_TO_BACKFILL} days...`);
  const today = new Date();
  let successfulDays = 0;
  let failedDays = 0;
  
  for (let i = DAYS_TO_BACKFILL; i >= 0; i--) {
    const date = subDays(today, i);
    try {
      await fetchDataForDate(date);
      successfulDays++;
      
      if (i > 0) {
        console.log('\nWaiting before processing next date...');
        await sleep(RETRY_DELAY * 2);
      }
    } catch (error) {
      failedDays++;
      console.error(`Failed to process date ${format(date, 'yyyy-MM-dd')}:`, error);
      await sleep(RETRY_DELAY * 4);
    }
  }

  return { successfulDays, failedDays };
}

console.log('=== NBA Predictions Backfill Script ===\n');
backfillData()
  .then(({ successfulDays, failedDays }) => {
    console.log('\n=== Backfill Summary ===');
    console.log(`Successfully processed: ${successfulDays} days`);
    console.log(`Failed to process: ${failedDays} days`);
    console.log('======================\n');
    process.exit(failedDays > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  });