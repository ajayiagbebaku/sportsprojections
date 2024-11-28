import axios from 'axios';
import { formatApiDate } from './dateUtils';

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
    console.log('Fetching odds from API for date:', formattedDate);

    const response = await api.get('/getNBABettingOdds', {
      params: {
        gameDate: formattedDate,
        itemFormat: 'list'
      }
    });

    if (!response.data?.body) {
      console.log('No odds found for date:', formattedDate);
      return null;
    }

    return response.data.body;
  } catch (error) {
    console.error('Error fetching odds:', error);
    throw error;
  }
}

export async function fetchNBASchedule(date: string) {
  try {
    const formattedDate = formatApiDate(date);
    console.log('Fetching schedule for date:', formattedDate);

    const response = await api.get('/getNBAGamesForDate', {
      params: { gameDate: formattedDate }
    });

    if (!response.data?.body || !Array.isArray(response.data.body)) {
      console.log('No games found for date:', formattedDate);
      return [];
    }

    return response.data.body;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}