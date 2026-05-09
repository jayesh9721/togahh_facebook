const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://cdssxtquayzijmbnlqmt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkc3N4dHF1YXl6aWptYm5scW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDI4MDcsImV4cCI6MjA4MzkxODgwN30.My8tzvRNxUwHfajQ5QyqTrfvHQ0GR2L0P075YkgxuVc"
);

async function checkAllAds() {
  console.log('Checking all entries in your_name_table...');
  const { data, error } = await supabase
    .from('your_name_table')
    .select('*')
    .order('time', { ascending: false });

  if (error) {
    console.error('Error fetching ads:', error);
    return;
  }

  console.log('Total entries:', data.length);
  data.forEach(row => {
    console.log(`ID: ${row.id}, URL: ${row.text}`);
  });
}

checkAllAds();
