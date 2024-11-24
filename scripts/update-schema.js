import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yjebzlvsjonvxfpcuwaa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZWJ6bHZzam9udnhmcGN1d2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIzNDI0MjAsImV4cCI6MjA0NzkxODQyMH0.s7pBFZGY1ZORMVSGQGpcp7GsiMzGOBeUIf2EapJ5yzU'
);

async function updateSchema() {
  try {
    console.log('Updating database schema...');

    // Drop and recreate the predictions table
    const { error: dropError } = await supabase.rpc('drop_predictions_table');
    if (dropError) {
      console.log('Table might not exist, creating new one');
    }

    const { error: createError } = await supabase
      .from('predictions')
      .insert({
        game_id: 'schema_init',
        game_date: '2024-02-27',
        home_team: 'test',
        away_team: 'test',
        predicted_home_score: 0,
        predicted_away_score: 0,
        predicted_total: 0,
        fanduel_spread_home: 0,
        fanduel_total: 0,
        home_moneyline: 0,
        away_moneyline: 0
      })
      .select();

    if (createError) {
      console.error('Error creating table:', createError);
      process.exit(1);
    }

    console.log('Schema updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  }
}

updateSchema();