const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "https://cdssxtquayzijmbnlqmt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkc3N4dHF1YXl6aWptYm5scW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDI4MDcsImV4cCI6MjA4MzkxODgwN30.My8tzvRNxUwHfajQ5QyqTrfvHQ0GR2L0P075YkgxuVc"
);

async function deepCheck() {
  console.log('Deep checking buckets in cdssxtquayzijmbnlqmt...');
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  if (bError) {
    console.error('Error listing buckets:', bError);
    return;
  }

  console.log('Buckets found:', buckets.length);
  for (const b of buckets) {
    console.log(`Checking bucket: ${b.name}`);
    const { data: files, error: fError } = await supabase.storage.from(b.name).list();
    if (fError) {
      console.error(`Error listing files in ${b.name}:`, fError);
    } else {
      console.log(`Files in ${b.name}:`, files.length);
      files.forEach(f => console.log(`  - ${f.name}`));
    }
  }
}

deepCheck();
