const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://cdssxtquayzijmbnlqmt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkc3N4dHF1YXl6aWptYm5scW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDI4MDcsImV4cCI6MjA4MzkxODgwN30.My8tzvRNxUwHfajQ5QyqTrfvHQ0GR2L0P075YkgxuVc"
);

async function checkAd4() {
  console.log('Checking Ad 4 in your_name_table...');
  const { data, error } = await supabase
    .from('your_name_table')
    .select('*')
    .eq('id', '4')
    .order('time', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching Ad 4:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data found for Ad 4');
  } else {
    console.log('Ad 4 Data:', JSON.stringify(data[0], null, 2));
  }
}

checkAd4();
