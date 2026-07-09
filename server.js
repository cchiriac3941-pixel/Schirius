require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const GENIUS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Token Spotify in memoria
let spotifyAccessToken = '';
let spotifyTokenExpiresAt = 0;

// Funzione per ottenere il token di Spotify
async function getSpotifyToken() {
  if (spotifyAccessToken && Date.now() < spotifyTokenExpiresAt) {
    return spotifyAccessToken;
  }
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  if (data.access_token) {
    spotifyAccessToken = data.access_token;
    spotifyTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // Scade un minuto prima per sicurezza
    return spotifyAccessToken;
  }
  throw new Error("Impossibile ottenere il token Spotify");
}

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Parametro q mancante' });

  try {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    // Per compatibilità col vecchio sistema, adattiamo i risultati
    const risultati = data.artists.items.map(artist => ({
      titolo: artist.name, // in questo caso è l'artista
      artista: artist.name,
      copertina: artist.images.length > 0 ? artist.images[0].url : '',
      id: artist.id,
      type: 'artist'
    }));
    res.json(risultati);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella ricerca' });
  }
});

app.get('/api/spotify/artist', async (req, res) => {
  const artistName = req.query.artist;
  if (!artistName) return res.status(400).json({ error: 'Parametro artist mancante' });

  try {
    const token = await getSpotifyToken();
    
    // 1. Cerca l'artista su Spotify
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    if (!searchData.artists.items || searchData.artists.items.length === 0) {
      return res.status(404).json({ error: 'Artista non trovato su Spotify' });
    }
    
    const artist = searchData.artists.items[0];
    const spotifyArtistId = artist.id;

    // 2. Cerca l'artista su Genius per la Bio (visto che Spotify non ce l'ha)
    let bio = "";
    try {
      const gSearchRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(artistName)}`, { headers: { Authorization: `Bearer ${GENIUS_TOKEN}` } });
      const gSearchData = await gSearchRes.json();
      if (gSearchData.response.hits && gSearchData.response.hits.length > 0) {
        const gArtistId = gSearchData.response.hits[0].result.primary_artist.id;
        const gBioRes = await fetch(`https://api.genius.com/artists/${gArtistId}?text_format=plain`, { headers: { Authorization: `Bearer ${GENIUS_TOKEN}` } });
        const gBioData = await gBioRes.json();
        bio = gBioData.response?.artist?.description?.plain || "";
      }
    } catch (e) { console.error("Genius bio error", e); }

    // 3. Recupera gli album/singoli dell'artista su Spotify
    const canzoni = [];
    const visti = new Set();
    
    // Usiamo limit=50 in una singola richiesta per evitare il "Too many requests" (Rate Limiting) di Spotify
    const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${spotifyArtistId}/albums?include_groups=album,single,appears_on&limit=50&offset=0`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (albumsRes.ok) {
      const albumsData = await albumsRes.json();
      if (albumsData.items) {
        for (const item of albumsData.items) {
          if (!visti.has(item.name)) {
            visti.add(item.name);
            
            let isAppearsOn = item.artists[0].id !== spotifyArtistId;
            let computedGroup = isAppearsOn ? 'appears_on' : item.album_type;

            canzoni.push({
              id: item.id,
              titolo: item.name,
              artista: item.artists.map(a => a.name).join(', '),
              copertina: item.images.length > 0 ? item.images[0].url : '',
              album_group: item.album_group || computedGroup,
              release_date: item.release_date
            });
          }
        }
      }
    } else {
      console.error("Spotify API error: ", await albumsRes.text());
    }

    res.json({
      artistId: artist.id,
      artistName: artist.name,
      artistImage: artist.images.length > 0 ? artist.images[0].url : '',
      bio,
      canzoni
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dati artista' });
  }
});

app.get('/api/spotify/album', async (req, res) => {
  const albumId = req.query.id;
  if (!albumId) return res.status(400).json({ error: 'Parametro id mancante' });

  try {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    res.json({
      id: data.id,
      name: data.name,
      cover: data.images.length > 0 ? data.images[0].url : '',
      artist: data.artists[0].name,
      release_date: data.release_date,
      tracks: data.tracks.items.map(t => ({
        id: t.id,
        name: t.name,
        preview_url: t.preview_url,
        artist: t.artists.map(a => a.name).join(', ')
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dell\'album' });
  }
});

app.get('/api/spotify/track', async (req, res) => {
  const trackId = req.query.id;
  if (!trackId) return res.status(400).json({ error: 'Parametro id mancante' });

  try {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    res.json({
      id: data.id,
      name: data.name,
      artist: data.artists[0].name,
      cover: data.album.images.length > 0 ? data.album.images[0].url : '',
      album: data.album.name,
      preview_url: data.preview_url,
      spotify_url: data.external_urls.spotify
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero della traccia' });
  }
});

app.get('/api/lyrics', async (req, res) => {
  const { artist, title } = req.query;
  try {
    const lyricsRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
    const data = await lyricsRes.json();
    res.json({ lyrics: data.lyrics || "Testo non trovato. Riprova più tardi." });
  } catch (err) {
    res.status(500).json({ error: 'Testo non trovato' });
  }
});

app.listen(3000, () => console.log('Server attivo su http://localhost:3000'));