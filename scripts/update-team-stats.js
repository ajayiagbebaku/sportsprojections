import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjebzlvsjonvxfpcuwaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Team code mapping to ensure consistency
const teamCodeMapping = {
  'ATL': 'ATL',
  'BOS': 'BOS',
  'BKN': 'BKN',
  'CHA': 'CHA',
  'CHI': 'CHI',
  'CLE': 'CLE',
  'DAL': 'DAL',
  'DEN': 'DEN',
  'DET': 'DET',
  'GSW': 'GSW',
  'HOU': 'HOU',
  'IND': 'IND',
  'LAC': 'LAC',
  'LAL': 'LAL',
  'MEM': 'MEM',
  'MIA': 'MIA',
  'MIL': 'MIL',
  'MIN': 'MIN',
  'NOP': 'NOP',
  'NYK': 'NYK',
  'OKC': 'OKC',
  'ORL': 'ORL',
  'PHI': 'PHI',
  'PHX': 'PHX',
  'POR': 'POR',
  'SAC': 'SAC',
  'SAS': 'SAS',
  'TOR': 'TOR',
  'UTA': 'UTA',
  'WAS': 'WAS'
};

async function fetchAndUpdateStats() {
  try {
    console.log('Fetching NBA team stats...');
    const response = await axios.get('https://www.nbastuffer.com/2024-2025-nba-team-stats/');
    const $ = cheerio.load(response.data);
    
    // Process the stats table
    const updates = [];
    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header row
      
      const cols = $(row).find('td');
      if (cols.length > 0) {
        const teamCode = $(cols[0]).text().trim();
        const teamName = $(cols[1]).text().trim();
        
        if (teamCodeMapping[teamCode]) {
          const stats = {
            team_code: teamCode,
            team_name: teamName,
            ppg: parseFloat($(cols[3]).text()),
            oppg: parseFloat($(cols[4]).text()),
            pace: parseFloat($(cols[5]).text()),
            updated_at: new Date().toISOString()
          };

          if (!isNaN(stats.ppg) && !isNaN(stats.oppg) && !isNaN(stats.pace)) {
            updates.push(stats);
          }
        }
      }
    });

    if (updates.length > 0) {
      console.log(`Found ${updates.length} teams to update`);
      
      // Update stats in database
      const { error } = await supabase
        .from('team_stats')
        .upsert(updates, {
          onConflict: 'team_code',
          returning: 'minimal'
        });

      if (error) {
        console.error('Error updating team stats:', error);
        process.exit(1);
      }

      console.log('Successfully updated team stats');
    } else {
      console.log('No valid team stats found to update');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating stats:', error);
    process.exit(1);
  }
}

// Run the update
fetchAndUpdateStats();