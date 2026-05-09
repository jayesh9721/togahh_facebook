const https = require('https');

function checkFile() {
  const url = "https://cdssxtquayzijmbnlqmt.supabase.co/storage/v1/object/public/n8n/finalbefore2.mp3";
  console.log(`Checking file: ${url}`);
  https.get(url, (res) => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    res.resume();
  }).on('error', (e) => {
    console.error('Error:', e.message);
  });
}

checkFile();
