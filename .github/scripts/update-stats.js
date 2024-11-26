import axios from 'axios';
import cheerio from 'cheerio';
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

async function fetchNBAStats() {
  try {
    console.log('Fetching NBA team stats...');
    const response = await axios.get('https://www.nbastuffer.com/2024-2025-nba-team-stats/');
    const $ = cheerio.load(response.data);
    
    const stats = [];
    
    // Process the stats table
    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const cols = $(row).find('td');
      if (cols.length > 0) {
        const teamCode = $(cols[0]).text().trim();
        const teamName = teamCodeMapping[teamCode];
        
        if (teamName) {
          const ppg = parseFloat($(cols[3]).text());
          const oppg = parseFloat($(cols[4]).text());
          const pace = parseFloat($(cols[5]).text());

          if (!isNaN(ppg) && !isNaN(oppg) && !isNaN(pace)) {
            stats.push({
              team_name: teamName,
              team_code: teamCode,
              ppg,
              oppg,
              pace,
              updated_at: new Date().toISOString()
            });
          }
        }
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching NBA stats:', error);
    throw error;
  }
}

async function updateTeamStats() {
  try {
    console.log('Starting team stats update...');
    
    // Fetch current stats
    const stats = await fetchNBAStats();
    console.log(`Fetched stats for ${stats.length} teams`);

    // Update each team's stats in the database
    for (const stat of stats) {
      const { error } = await supabase
        .from('team_stats')
        .upsert(stat, {
          onConflict: 'team_code',
          returning: 'minimal'
        });

      if (error) {
        console.error(`Error updating stats for ${stat.team_name}:`, error);
      } else {
        console.log(`Updated stats for ${stat.team_name}`);
      }
    }

    console.log('Team stats update completed successfully');
  } catch (error) {
    console.error('Failed to update team stats:', error);
    process.exit(1);
  }
}

// Run the update
updateTeamStats()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));