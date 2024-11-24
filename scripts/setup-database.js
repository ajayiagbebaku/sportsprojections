import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yjebzlvsjonvxfpcuwaa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU'
);

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // First, try to delete all existing records
    const { error: clearError } = await supabase
      .from('predictions')
      .delete()
      .neq('id', 0); // Delete all records

    if (clearError && clearError.code !== 'PGRST116') {
      console.error('Error clearing table:', clearError);
    }

    // Create a test record to ensure table exists with correct schema
    const { error: insertError } = await supabase
      .from('predictions')
      .insert({
        game_id: 'SETUP_TEST',
        game_date: '2024-02-27',
        home_team: 'Test Home',
        away_team: 'Test Away',
        predicted_home_score: 100,
        predicted_away_score: 95,
        predicted_total: 195,
        fanduel_spread_home: -2.5,
        fanduel_total: 220.5
      });

    if (insertError) {
      console.error('Error creating test record:', insertError);
      process.exit(1);
    }

    // Clean up the test record
    const { error: cleanupError } = await supabase
      .from('predictions')
      .delete()
      .eq('game_id', 'SETUP_TEST');

    if (cleanupError) {
      console.warn('Warning: Could not clean up test record:', cleanupError);
    }

    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();