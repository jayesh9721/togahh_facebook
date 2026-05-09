const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://cdssxtquayzijmbnlqmt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkc3N4dHF1YXl6aWptYm5scW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDI4MDcsImV4cCI6MjA4MzkxODgwN30.My8tzvRNxUwHfajQ5QyqTrfvHQ0GR2L0P075YkgxuVc"
);

async function checkStatusTable() {
  console.log('Checking status_table...');
  const { data, error } = await supabase
    .from('status_table')
    .select('*')
    .order('id', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching status:', error);
    return;
  }

  console.log('Status entries:', JSON.stringify(data, null, 2));
}

checkStatusTable();
