const https = require('https');

function checkFile() {
  const url = "https://cdssxtquayzijmbnlqmt.supabase.co/storage/v1/object/AD1/08-04-2026_11-55AM.mp4";
  console.log(`Checking file: ${url}`);
  https.get(url, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    res.resume();
  }).on('error', (e) => {
    console.error('Error:', e.message);
  });
}

checkFile();
