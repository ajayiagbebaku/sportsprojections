import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// Configure CORS to allow requests from our Vite dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

const API_KEY = '2d2c1f1b92msh6a8546438f75ab7p18f644jsnfa55639522ed';
const API_HOST = 'tank01-fantasy-stats.p.rapidapi.com';

const api = axios.create({
  baseURL: 'https://tank01-fantasy-stats.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': API_HOST,
  }
});

// Proxy endpoint for NBA scores
app.get('/api/scores', async (req, res) => {
  try {
    const { gameDate } = req.query;
    console.log('Fetching scores for date:', gameDate);
    
    const response = await api.get('/getNBAScoresOnly', {
      params: {
        gameDate,
        topPerformers: 'false',
        lineups: 'false'
      }
    });

    if (response.data?.statusCode === 200) {
      res.json(response.data);
    } else {
      console.log('No scores found for date:', gameDate);
      res.json({ body: {} });
    }
  } catch (error) {
    console.error('Error fetching scores:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch scores', details: error.message });
  }
});

// Proxy endpoint for NBA odds
app.get('/api/odds', async (req, res) => {
  try {
    const { gameDate } = req.query;
    console.log('Fetching odds for date:', gameDate);
    
    const response = await api.get('/getNBABettingOdds', {
      params: {
        gameDate,
        itemFormat: 'list'
      }
    });

    if (response.data?.statusCode === 200) {
      res.json(response.data);
    } else {
      console.log('No odds found for date:', gameDate);
      res.json({ body: {} });
    }
  } catch (error) {
    console.error('Error fetching odds:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch odds', details: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});