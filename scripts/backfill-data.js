import axios from 'axios';
import { format, subDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import { teamStats } from './statsService.js';

const DAYS_TO_BACKFILL = 7;
const RETRY_DELAY = 1000;

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

async function processGame(gameId, game, scores, date) {
  try {
    // First check if we already have this game in the database
    const { data: existingGame } = await supabase
      .from('predictions')
      .select('*')
      .eq('game_id', gameId)
      .single();

    // If game exists and has results, skip it
    if (existingGame?.actual_home_score !== null && existingGame?.actual_away_score !== null) {
      console.log(`Game ${gameId} already processed with results, skipping...`);
      return;
    }

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

    // Generate prediction
    const prediction = generatePrediction(
      homeTeamKey,
      awayTeamKey,
      fanduelSpreadHome,
      fanduelTotal
    );

    // Get actual scores if game is completed
    const gameScore = scores[gameId];
    const actualHomeScore = gameScore?.homePts ? parseInt(gameScore.homePts) : null;
    const actualAwayScore = gameScore?.awayPts ? parseInt(gameScore.awayPts) : null;
    const gameStatus = gameScore?.gameStatus || (gameScore?.gameClock === 'Final' ? 'Completed' : null);

    // Calculate results if we have actual scores
    let spreadResult = null;
    let totalResult = null;

    if (actualHomeScore !== null && actualAwayScore !== null) {
      const results = determineResults(
        prediction,
        actualHomeScore,
        actualAwayScore,
        fanduelSpreadHome,
        fanduelTotal
      );
      spreadResult = results.spreadResult;
      totalResult = results.totalResult;
    }

    // Prepare record for upsert
    const record = {
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
    };

    // Use upsert to handle both new games and updates
    const { error } = await supabase
      .from('predictions')
      .upsert(record, {
        onConflict: 'game_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error saving prediction for game ${gameId}:`, error);
      return;
    }

    console.log(`Successfully processed game ${gameId}`);
    if (spreadResult) {
      console.log(`Results - Spread: ${spreadResult}, Total: ${totalResult}`);
    }
  } catch (error) {
    console.error(`Error processing game ${gameId}:`, error);
  }
}

// Rest of the code remains the same...