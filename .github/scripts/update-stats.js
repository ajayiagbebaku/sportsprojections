import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Team code mapping
const teamCodeMapping = {
  'ATL': 'Atlanta',
  'BOS': 'Boston',
  'BKN': 'Brooklyn',
  'CHA': 'Charlotte',
  'CHI': 'Chicago',
  'CLE': 'Cleveland',
  'DAL': 'Dallas',
  'DEN': 'Denver',
  'DET': 'Detroit',
  'GSW': 'Golden State',
  'HOU': 'Houston',
  'IND': 'Indiana',
  'LAC': 'LA Clippers',
  'LAL': 'LA Lakers',
  'MEM': 'Memphis',
  'MIA': 'Miami',
  'MIL': 'Milwaukee',
  'MIN': 'Minnesota',
  'NOP': 'New Orleans',
  'NYK': 'New York',
  'OKC': 'Oklahoma City',
  'ORL': 'Orlando',
  'PHI': 'Philadelphia',
  'PHX': 'Phoenix',
  'POR': 'Portland',
  'SAC': 'Sacramento',
  'SAS': 'San Antonio',
  'TOR': 'Toronto',
  'UTA': 'Utah',
  'WAS': 'Washington'
};

async function fetchAndUpdateStats() {
  try {
    console.log('Fetching NBA team stats...');
    const response = await axios.get('https://www.nbastuffer.com/2024-2025-nba-team-stats/');
    const $ = cheerio.load(response.data);
    
    // Process the stats table
    $('table tr').each(async (i, row) => {
      if (i === 0) return; // Skip header
      
      const cols = $(row).find('td');
      if (cols.length > 0) {
        const teamCode = $(cols[0]).text().trim();
        const teamName = teamCodeMapping[teamCode];
        
        if (teamName) {
          const ppg = parseFloat($(cols[3]).text());
          const oppg = parseFloat($(cols[4]).text());
          const pace = parseFloat($(cols[5]).text());

          if (!isNaN(ppg) && !isNaN(oppg) && !isNaN(pace)) {
            // Update stats in database
            const { error } = await supabase
              .from('team_stats')
              .update({
                ppg: ppg,
                oppg: oppg,
                pace: pace,
                updated_at: new Date().toISOString()
              })
              .eq('team_code', teamCode);

            if (error) {
              console.error(`Error updating stats for ${teamCode}:`, error);
            } else {
              console.log(`Updated stats for ${teamCode}`);
            }
          }
        }
      }
    });

    console.log('Stats update completed');
  } catch (error) {
    console.error('Error updating stats:', error);
    throw error;
  }
}

// Run the update
fetchAndUpdateStats()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));