const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://cdssxtquayzijmbnlqmt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkc3N4dHF1YXl6aWptYm5scW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDI4MDcsImV4cCI6MjA4MzkxODgwN30.My8tzvRNxUwHfajQ5QyqTrfvHQ0GR2L0P075YkgxuVc"
);

async function listBuckets() {
  console.log('Listing buckets in cdssxtquayzijmbnlqmt...');
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }

  console.log('Buckets:', data.map(b => b.name).join(', '));
}

listBuckets();
