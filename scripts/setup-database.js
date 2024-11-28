import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yjebzlvsjonvxfpcuwaa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9lZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU'
);

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Insert team stats
    const { error: insertError } = await supabase
      .from('team_stats')
      .upsert([
        { team_name: 'Atlanta', team_code: 'ATL', ppg: 114.9, oppg: 119.6, pace: 103.3 },
        { team_name: 'Boston', team_code: 'BOS', ppg: 121.5, oppg: 111.8, pace: 97.3 },
        { team_name: 'Brooklyn', team_code: 'BKN', ppg: 111.7, oppg: 114.7, pace: 96.3 },
        { team_name: 'Charlotte', team_code: 'CHA', ppg: 110.1, oppg: 114.5, pace: 97.7 },
        { team_name: 'Chicago', team_code: 'CHI', ppg: 115.4, oppg: 122.9, pace: 104.2 },
        { team_name: 'Cleveland', team_code: 'CLE', ppg: 123.5, oppg: 111.2, pace: 99.8 },
        { team_name: 'Dallas', team_code: 'DAL', ppg: 115.6, oppg: 109.3, pace: 98.1 },
        { team_name: 'Denver', team_code: 'DEN', ppg: 116.5, oppg: 115.1, pace: 100.2 },
        { team_name: 'Detroit', team_code: 'DET', ppg: 110.4, oppg: 111.6, pace: 97.8 },
        { team_name: 'Golden State', team_code: 'GSW', ppg: 119.6, oppg: 109.1, pace: 101.7 },
        { team_name: 'Houston', team_code: 'HOU', ppg: 114.6, oppg: 106.2, pace: 100.3 },
        { team_name: 'Indiana', team_code: 'IND', ppg: 114.3, oppg: 118.4, pace: 99.5 },
        { team_name: 'LA Clippers', team_code: 'LAC', ppg: 108.9, oppg: 108.1, pace: 97.6 },
        { team_name: 'LA Lakers', team_code: 'LAL', ppg: 117.3, oppg: 116.2, pace: 99.0 },
        { team_name: 'Memphis', team_code: 'MEM', ppg: 118.9, oppg: 112.6, pace: 104.1 },
        { team_name: 'Miami', team_code: 'MIA', ppg: 110.9, oppg: 110.1, pace: 97.2 },
        { team_name: 'Milwaukee', team_code: 'MIL', ppg: 111.3, oppg: 112.2, pace: 98.6 },
        { team_name: 'Minnesota', team_code: 'MIN', ppg: 113.3, oppg: 111.0, pace: 98.1 },
        { team_name: 'New Orleans', team_code: 'NOP', ppg: 103.5, oppg: 115.4, pace: 96.3 },
        { team_name: 'New York', team_code: 'NYK', ppg: 118.3, oppg: 111.9, pace: 96.0 },
        { team_name: 'Oklahoma City', team_code: 'OKC', ppg: 114.3, oppg: 103.6, pace: 100.5 },
        { team_name: 'Orlando', team_code: 'ORL', ppg: 106.8, oppg: 103.2, pace: 97.5 },
        { team_name: 'Philadelphia', team_code: 'PHI', ppg: 103.9, oppg: 112.6, pace: 96.6 },
        { team_name: 'Phoenix', team_code: 'PHX', ppg: 112.1, oppg: 114.5, pace: 96.8 },
        { team_name: 'Portland', team_code: 'POR', ppg: 106.8, oppg: 113.8, pace: 100.3 },
        { team_name: 'Sacramento', team_code: 'SAC', ppg: 116.9, oppg: 113.7, pace: 98.6 },
        { team_name: 'San Antonio', team_code: 'SAS', ppg: 110.1, oppg: 110.1, pace: 98.7 },
        { team_name: 'Toronto', team_code: 'TOR', ppg: 113.2, oppg: 118.6, pace: 98.9 },
        { team_name: 'Utah', team_code: 'UTA', ppg: 108.7, oppg: 119.3, pace: 99.7 },
        { team_name: 'Washington', team_code: 'WAS', ppg: 109.9, oppg: 124.7, pace: 103.0 }
      ], {
        onConflict: 'team_code',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error('Error inserting team stats:', insertError);
      process.exit(1);
    }

    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();