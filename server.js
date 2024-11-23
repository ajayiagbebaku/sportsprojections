import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors());

app.get('/api/nbastats', async (req, res) => {
  try {
    const response = await axios.get('https://www.nbastuffer.com/2024-2025-nba-team-stats/');
    const $ = cheerio.load(response.data);
    
    // Find the stats table
    const statsData = [];
    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const cols = $(row).find('td');
      if (cols.length > 0) {
        statsData.push({
          team: $(cols[0]).text().trim(),
          ppg: parseFloat($(cols[3]).text()),
          oppg: parseFloat($(cols[4]).text()),
          pace: parseFloat($(cols[5]).text())
        });
      }
    });

    res.json(statsData);
  } catch (error) {
    console.error('Error fetching NBA stats:', error);
    res.status(500).json({ error: 'Failed to fetch NBA stats' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});