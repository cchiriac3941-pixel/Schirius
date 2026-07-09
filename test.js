require('dotenv').config();
async function test() {
  const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  const token = data.access_token;
  
  const albumsRes = await fetch('https://api.spotify.com/v1/artists/23dqJIguBqf0Dty2oT1aE0/albums?limit=1', {
        headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log("Status:", albumsRes.status);
  console.log("Retry-After:", albumsRes.headers.get('retry-after'));
  console.log("Text:", await albumsRes.text());
}
test().catch(console.error);
