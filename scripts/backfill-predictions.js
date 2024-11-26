import axios from 'axios';
import { format, subDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';
const RAPIDAPI_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const RAPIDAPI_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Team stats and mapping directly in the file to avoid import issues
const teamStats = {
  "Atlanta": {"ppg": 114.9, "oppg": 119.6, "pace": 103.3},
  "Boston": {"ppg": 121.5, "oppg": 111.8, "pace": 97.3},
  "Brooklyn": {"ppg": 111.7, "oppg": 114.7, "pace": 96.3},
  "Charlotte": {"ppg": 110.1, "oppg": 114.5, "pace": 97.7},
  "Chicago": {"ppg": 115.4, "oppg": 122.9, "pace": 104.2},
  "Cleveland": {"ppg": 123.5, "oppg": 111.2, "pace": 99.8},
  "Dallas": {"ppg": 115.6, "oppg": 109.3, "pace": 98.1},
  "Denver": {"ppg": 116.5, "oppg": 115.1, "pace": 100.2},
  "Detroit": {"ppg": 110.4, "oppg": 111.6, "pace": 97.8},
  "Golden State": {"ppg": 119.6, "oppg": 109.1, "pace": 101.7},
  "Houston": {"ppg": 114.6, "oppg": 106.2, "pace": 100.3},
  "Indiana": {"ppg": 114.3, "oppg": 118.4, "pace": 99.5},
  "LA Clippers": {"ppg": 108.9, "oppg": 108.1, "pace": 97.6},
  "LA Lakers": {"ppg": 117.3, "oppg": 116.2, "pace": 99.0},
  "Memphis": {"ppg": 118.9, "oppg": 112.6, "pace": 104.1},
  "Miami": {"ppg": 110.9, "oppg": 110.1, "pace": 97.2},
  "Milwaukee": {"ppg": 111.3, "oppg": 112.2, "pace": 98.6},
  "Minnesota": {"ppg": 113.3, "oppg": 111.0, "pace": 98.1},
  "New Orleans": {"ppg": 103.5, "oppg": 115.4, "pace": 96.3},
  "New York": {"ppg": 118.3, "oppg": 111.9, "pace": 96.0},
  "Oklahoma City": {"ppg": 114.3, "oppg": 103.6, "pace": 100.5},
  "Orlando": {"ppg": 106.8, "oppg": 103.2, "pace": 97.5},
  "Philadelphia": {"ppg": 103.9, "oppg": 112.6, "pace": 96.6},
  "Phoenix": {"ppg": 112.1, "oppg": 114.5, "pace": 96.8},
  "Portland": {"ppg": 106.8, "oppg": 113.8, "pace": 100.3},
  "Sacramento": {"ppg": 116.9, "oppg": 113.7, "pace": 98.6},
  "San Antonio": {"ppg": 110.1, "oppg": 110.1, "pace": 98.7},
  "Toronto": {"ppg": 113.2, "oppg": 118.6, "pace": 98.9},
  "Utah": {"ppg": 108.7, "oppg": 119.3, "pace": 99.7},
  "Washington": {"ppg": 109.9, "oppg": 124.7, "pace": 103.0}
};

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

async function fetchOddsAndScores(date) {
  const formattedDate = format(date, 'yyyyMMdd');
  console.log(`\nFetching data for ${formattedDate}`);

  try {
    // First check if we already have predictions for this date
    const { data: existingPredictions } = await supabase
      .from('predictions')
      .select('game_id')
      .eq('game_date', format(date, 'yyyy-MM-dd'));

    if (existingPredictions?.length > 0) {
      console.log(`Found ${existingPredictions.length} existing predictions for ${formattedDate}, skipping...`);
      return null;
    }

    const [oddsResponse, scoresResponse] = await Promise.all([
      axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBABettingOdds', {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        params: {
          gameDate: formattedDate,
          itemFormat: 'list'
        }
      }),
      axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBAScoresOnly', {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST
        },
        params: {
          gameDate: formattedDate,
          topPerformers: 'false',
          lineups: 'false'
        }
      })
    ]);

    return {
      odds: oddsResponse.data?.body || {},
      scores: scoresResponse.data?.body || {}
    };
  } catch (error) {
    console.error(`Error fetching data for ${formattedDate}:`, error.message);
    return null;
  }
}

function generatePrediction(homeTeam, awayTeam, fanduelSpreadHome, fanduelTotal) {
  const homeStats = teamStats[homeTeam];
  const awayStats = teamStats[awayTeam];

  if (!homeStats || !awayStats) {
    throw new Error(`Stats not found for ${homeTeam} or ${awayTeam}`);
  }

  // Calculate base scores
  let homeScore = (homeStats.ppg + awayStats.oppg) / 2;
  let awayScore = (awayStats.ppg + homeStats.oppg) / 2;

  // Pace adjustment
  const paceAdjustment = (homeStats.pace + awayStats.pace) / 200;
  homeScore *= paceAdjustment;
  awayScore *= paceAdjustment;

  // Home court advantage
  homeScore += 3.5;

  return {
    homeScore: Math.round(homeScore),
    awayScore: Math.round(awayScore),
    totalScore: Math.round(homeScore + awayScore),
    projectedSpread: Math.round(homeScore - awayScore)
  };
}

function calculateResults(prediction, actualHomeScore, actualAwayScore, fanduelSpreadHome, fanduelTotal) {
  const actualSpread = actualHomeScore - actualAwayScore;
  const actualTotal = actualHomeScore + actualAwayScore;

  // Calculate spread result
  let spreadResult;
  if (Math.abs(actualSpread - fanduelSpreadHome) < 0.5) {
    spreadResult = 'push';
  } else {
    spreadResult = actualSpread > fanduelSpreadHome ? 'win' : 'loss';
  }

  // Calculate total result
  let totalResult;
  if (Math.abs(actualTotal - fanduelTotal) < 0.5) {
    totalResult = 'push';
  } else {
    totalResult = actualTotal > fanduelTotal ? 'over' : 'under';
  }

  return { spreadResult, totalResult };
}

async function processGamesForDate(date) {
  const data = await fetchOddsAndScores(date);
  if (!data) return;

  const { odds, scores } = data;
  const isoDate = format(date, 'yyyy-MM-dd');
  
  for (const [gameId, game] of Object.entries(odds)) {
    try {
      const homeTeamKey = teamCodeMapping[game.homeTeam];
      const awayTeamKey = teamCodeMapping[game.awayTeam];

      if (!homeTeamKey || !awayTeamKey) {
        console.warn(`Unknown team mapping for ${game.homeTeam} or ${game.awayTeam}`);
        continue;
      }

      const fanduelBook = game.sportsBooks?.find(book => 
        book.sportsBook.toLowerCase() === 'fanduel'
      );
      
      if (!fanduelBook?.odds) {
        console.warn('No FanDuel odds found for game', gameId);
        continue;
      }

      const fanduelOdds = fanduelBook.odds;
      const fanduelSpreadHome = parseFloat(fanduelOdds.homeTeamSpread);
      const fanduelTotal = parseFloat(fanduelOdds.totalOver);

      if (isNaN(fanduelSpreadHome) || isNaN(fanduelTotal)) {
        console.warn('Invalid odds values for game', gameId);
        continue;
      }

      // Generate prediction
      const prediction = generatePrediction(
        homeTeamKey,
        awayTeamKey,
        fanduelSpreadHome,
        fanduelTotal
      );

      // Get actual scores and results
      const gameScore = scores[gameId];
      const actualHomeScore = gameScore?.homePts ? parseInt(gameScore.homePts) : null;
      const actualAwayScore = gameScore?.awayPts ? parseInt(gameScore.awayPts) : null;
      
      let spreadResult = null;
      let totalResult = null;

      if (actualHomeScore !== null && actualAwayScore !== null) {
        const results = calculateResults(
          prediction,
          actualHomeScore,
          actualAwayScore,
          fanduelSpreadHome,
          fanduelTotal
        );
        spreadResult = results.spreadResult;
        totalResult = results.totalResult;
      }

      // Save to database
      const { error } = await supabase
        .from('predictions')
        .upsert({
          game_id: gameId,
          game_date: isoDate,
          home_team: homeTeamKey,
          away_team: awayTeamKey,
          predicted_home_score: prediction.homeScore,
          predicted_away_score: prediction.awayScore,
          predicted_total: prediction.totalScore,
          fanduel_spread_home: fanduelSpreadHome,
          fanduel_total: fanduelTotal,
          actual_home_score: actualHomeScore,
          actual_away_score: actualAwayScore,
          spread_result: spreadResult,
          total_result: totalResult,
          game_status: gameScore?.gameStatus || 'Scheduled'
        });

      if (error) {
        console.error(`Error saving prediction for game ${gameId}:`, error);
      } else {
        console.log(`Successfully processed game ${gameId}`);
      }
    } catch (error) {
      console.error(`Error processing game ${gameId}:`, error);
    }
  }

  // Add delay between dates to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function backfillPredictions() {
  try {
    const today = new Date();
    const startDate = subDays(today, 7); // Start from 7 days ago

    console.log(`Starting backfill from ${format(startDate, 'yyyy-MM-dd')} to ${format(today, 'yyyy-MM-dd')}`);

    let currentDate = startDate;
    while (currentDate <= today) {
      await processGamesForDate(currentDate);
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
    }

    console.log('Backfill completed successfully');
  } catch (error) {
    console.error('Backfill failed:', error);
    throw error;
  }
}

// Run the backfill
backfillPredictions()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));