import axios from 'axios';
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';
const RAPIDAPI_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const RAPIDAPI_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchScheduleForDate(date) {
  try {
    const formattedDate = format(date, 'yyyyMMdd');
    console.log(`Fetching schedule for ${formattedDate}`);

    const response = await axios.get('https://tank01-fantasy-stats.p.rapidapi.com/getNBAGamesForDate', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      },
      params: { gameDate: formattedDate }
    });

    if (!response.data?.body || !Array.isArray(response.data.body)) {
      console.log(`No games found for ${formattedDate}`);
      return [];
    }

    const games = response.data.body.map(game => ({
      game_id: game.gameID,
      game_date: format(date, 'yyyy-MM-dd'),
      home_team: game.home,
      away_team: game.away,
      team_id_home: game.home,
      team_id_away: game.away
    })).filter(game => game.home_team && game.away_team);

    if (games.length > 0) {
      const { error } = await supabase