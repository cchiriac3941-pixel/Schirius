require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const GENIUS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Parametro q mancante' });
  }

  try {
    const geniusRes = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${GENIUS_TOKEN}` } }
    );
    const data = await geniusRes.json();
    console.log(data);

    const risultati = data.response.hits.map(hit => ({
      titolo: hit.result.title,
      artista: hit.result.primary_artist.name,
      copertina: hit.result.song_art_image_url,
      urlGenius: hit.result.url,
      id: hit.result.id
    }));

    res.json(risultati);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella ricerca Genius' });
}
});

app.get('/api/lyrics', async (req, res) => {
  const { artist, title } = req.query;

  try {
    const lyricsRes = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
    );
    const data = await lyricsRes.json();
    res.json({ lyrics: data.lyrics || null });
  } catch (err) {
    res.status(500).json({ error: 'Testo non trovato' });
  }
});

app.get('/api/artist/songs', async (req, res) => {
  const artistName = req.query.artist;

  if (!artistName) {
    return res.status(400).json({ error: 'Parametro artist mancante' });
  }

  try {
    const searchRes = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(artistName)}`,
      { headers: { Authorization: `Bearer ${GENIUS_TOKEN}` } }
    );
    const searchData = await searchRes.json();
    const hits = searchData.response.hits;

    if (!hits || hits.length === 0) {
      return res.status(404).json({ error: 'Artista non trovato su Genius' });
    }

    const artistId = hits[0].result.primary_artist.id;

    const songsRes = await fetch(
      `https://api.genius.com/artists/${artistId}/songs?per_page=20&sort=popularity`,
      { headers: { Authorization: `Bearer ${GENIUS_TOKEN}` } }
    );
    const songsData = await songsRes.json();

    const canzoni = songsData.response.songs.map(song => ({
      id: song.id,
      titolo: song.title,
      artista: song.primary_artist.name,
      copertina: song.song_art_image_thumbnail_url,
      urlGenius: song.url
    }));

    res.json(canzoni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero delle canzoni dell\'artista' });
  }
});

app.listen(3000, () => console.log('Server attivo su http://localhost:3000'));

