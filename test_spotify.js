require('dotenv').config();
const fetch = require('node-fetch');

async function test() {
    try {
        const auth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        const tokenData = await tokenRes.json();
        const token = tokenData.access_token;
        console.log("Token:", !!token);

        const artistName = "Sfera Ebbasta";
        const spotifySearchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log("Status:", spotifySearchRes.status);
        if (spotifySearchRes.ok) {
            const sData = await spotifySearchRes.json();
            if (sData.artists && sData.artists.items.length > 0) {
                const artistImage = sData.artists.items[0].images && sData.artists.items[0].images.length > 0 ? sData.artists.items[0].images[0].url : '';
                console.log("Image found:", artistImage);
            } else {
                console.log("No items found");
            }
        } else {
            console.log("Not ok:", await spotifySearchRes.text());
        }
    } catch(e) {
        console.error(e);
    }
}
test();
