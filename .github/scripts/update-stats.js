import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchNBAStats() {
  try {
    const response = await axios.get('https://www.nbastuffer.com/2024-2025-nba-team-stats/');
    const $ = cheerio.load(response.data);
    
    const stats = {};
    
    // Process the stats table
    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header
      
      const cols = $(row).find('td');
      if (cols.length > 0) {
        const teamCode = $(cols[0]).text().trim();
        const teamName = getTeamName(teamCode);
        
        if (teamName) {
          stats[teamName] = {
            ppg: parseFloat($(cols[3]).text()),
            oppg: parseFloat($(cols[4]).text()),
            pace: parseFloat($(cols[5]).text())
          };
        }
      }
    });

    return stats;
  } catch (error) {
    console.error('Error fetching NBA stats:', error);
    throw error;
  }
}

function getTeamName(code) {
  const teamMapping = {
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
  
  return teamMapping[code];
}

async function updateStatsFile() {
  try {
    const stats = await fetchNBAStats();
    
    const content = `// Auto-generated on ${new Date().toISOString()}
export const teamStats = ${JSON.stringify(stats, null, 2)};`;
    
    fs.writeFileSync('src/data/teamStats.ts', content);
    console.log('Successfully updated NBA team stats');
  } catch (error) {
    console.error('Failed to update stats:', error);
    process.exit(1);
  }
}

updateStatsFile();