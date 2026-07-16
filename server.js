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
    spotifyTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return spotifyAccessToken;
  }
  throw new Error("Impossibile ottenere il token Spotify");
}

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Parametro q mancante' });

  try {
    const token = await getSpotifyToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,track&limit=3`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    let risultati = [];
    
    // Aggiungi artisti
    if (data.artists && data.artists.items) {
      risultati = risultati.concat(data.artists.items.map(artist => ({
        titolo: artist.name,
        artista: 'Artista',
        copertina: artist.images && artist.images.length > 0 ? artist.images[0].url : '',
        id: artist.id,
        type: 'artist'
      })));
    }
    
    // Aggiungi tracce
    if (data.tracks && data.tracks.items) {
      risultati = risultati.concat(data.tracks.items.map(track => ({
        titolo: track.name,
        artista: track.artists.map(a => a.name).join(', '),
        copertina: track.album.images && track.album.images.length > 0 ? track.album.images[0].url : '',
        id: track.id,
        type: 'track'
      })));
    }
    
    res.json(risultati);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nella ricerca' });
  }
});

let homeRecsCache = null;
let homeRecsCacheTime = 0;

app.get('/api/home-recommendations', async (req, res) => {
  if (homeRecsCache && Date.now() - homeRecsCacheTime < 300000) { // Cache per 5 minuti
      // Per avere sempre casualità, mescoliamo la cache al ritorno
      return res.json([...homeRecsCache].sort(() => 0.5 - Math.random()));
  }

  // Lista degli artisti hardcoded in artist.html
  const SUPPORTED_ARTISTS = [
    "Lazza", "Sfera Ebbasta", "Shiva", "Capo Plaza", "Artie 5ive", "Kid Yugi", 
    "Tony Boy", "Ghali", "Travis Scott", "Playboi Carti", "Drake", "Future", 
    "Young Thug", "Metro Boomin", "Salmo", "Niky Savage", "Lil Cr", "Diss Gacha", "Lil Baby"
  ];
  
  // Scegli 5 artisti casuali per la home
  const shuffled = [...SUPPORTED_ARTISTS].sort(() => 0.5 - Math.random());
  const selectedArtists = shuffled.slice(0, 5);
  
  try {
    const token = await getSpotifyToken();
    const recommendations = [];

    for (const artistName of selectedArtists) {
      const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const searchData = await searchRes.json();
      
      if (searchData.artists && searchData.artists.items && searchData.artists.items.length > 0) {
        const artist = searchData.artists.items[0];
        
        let isHero = recommendations.length === 0;
        
        if (isHero) {
            const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (albumsRes.ok) {
                const albumsData = await albumsRes.json();
                if (albumsData.items && albumsData.items.length > 0) {
                    const album = albumsData.items[0];
                    recommendations.push({
                        id: album.id,
                        title: album.name,
                        artist: artist.name,
                        cover: album?.images?.[0]?.url || album?.album?.images?.[0]?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
                        type: 'album'
                    });
                }
            }
        } else {
            // Sostituito /top-tracks (che ora dà 403) con gli ultimi singoli dell'artista
            const singlesRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=single&limit=1`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (singlesRes.ok) {
                const singlesData = await singlesRes.json();
                if (singlesData.items && singlesData.items.length > 0) {
                  const single = singlesData.items[0];
                  recommendations.push({
                    id: single.id,
                    title: single.name,
                    artist: artist.name,
                    cover: single?.images?.[0]?.url || single?.album?.images?.[0]?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
                    type: 'track'
                  });
                }
            }
        }
      }
      // Piccolo ritardo per evitare Rate Limit (Errore 429) di Spotify
      await new Promise(r => setTimeout(r, 150));
    }
    
    if (recommendations.length > 0) {
        homeRecsCache = recommendations;
        homeRecsCacheTime = Date.now();
        return res.json(recommendations);
    } else {
        throw new Error("Nessun brano raccomandato ottenuto");
    }
  } catch (err) {
    console.error("Errore home-recommendations", err);
    // Dati di fallback reali (Album veri da iTunes invece di tracce) con ID Collection validi per superare i blocchi API.
    const emergencyFallback = [
        { id: "1668997865", title: "Cenere", artist: "Lazza", artistId: "238y1dKPtMeFEpX3Y6H1Vr", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/bc/9f/95/bc9f95f4-3ea3-9d48-356a-2dfcd7fcceb2/23UMGIM08249.rgb.jpg/600x600bb.jpg", type: "track" },
        { id: "1440864547", title: "Visiera A Becco", artist: "Sfera Ebbasta", artistId: "23TFHmajVfBtlRx5MXqgoz", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/ac/b7/21/acb72195-e5bf-f6bd-5f1e-e886ea1cb6e7/00602557145502.rgb.jpg/600x600bb.jpg", type: "track" },
        { id: "1654187943", title: "Non lo sai", artist: "Shiva", artistId: "0L1yQIKdMofE8yU05b8F3T", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/ce/22/0c/ce220c8f-f14a-f3e0-6a0c-613d9692ddda/196871510486.jpg/600x600bb.jpg", type: "track" },
        { id: "1857815238", title: "Capri Sun", artist: "Capo Plaza", artistId: "6XW4B9ZJdcbUqA1mIigIIf", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b9/62/8b/b9628bde-dce3-5967-dfdc-4d2c88421b8f/5054197940173.jpg/600x600bb.jpg", type: "track" },
        { id: "1858575519", title: "Anelli E Collane", artist: "Artie 5ive", artistId: "5Fm7jYF6s1wV3W1pP75B3Z", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/c7/2b/8e/c72b8ee3-e407-35ad-3236-41718fdf9dc7/5054198007202.jpg/600x600bb.jpg", type: "track" }
    ];
    return res.json(emergencyFallback);
  }
});

let featuredContentCache = null;
let featuredContentCacheTime = 0;

app.get('/api/featured-content', async (req, res) => {
    // Cache di 1 ora per proteggere le quote API
    if (featuredContentCache && Date.now() - featuredContentCacheTime < 3600000) {
        return res.json(featuredContentCache);
    }
    
    try {
        const token = await getSpotifyToken();
        
        const SUPPORTED_ARTISTS = [
            "Lazza", "Sfera Ebbasta", "Shiva", "Capo Plaza", "Artie 5ive", "Kid Yugi", 
            "Tony Boy", "Geolier", "Tedua", "Guè", "Marracash", "Salmo"
        ];
        
        // 1. Simula Top 10 FIMI unendo e ordinando per popolarità i Top Tracks dei 5 "Big"
        const FIMI_ARTISTS = ["Sfera Ebbasta", "Lazza", "Geolier", "Shiva", "thasup"];
        let allTopTracks = [];
        
        for (const artistName of FIMI_ARTISTS) {
            try {
                // Spotify Top Tracks dà 403, quindi usiamo la search per traccia
                const searchRes = await fetch(`https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(artistName)}&type=track&limit=5`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (searchRes.ok) {
                    const topData = await searchRes.json();
                    if (topData.tracks && topData.tracks.items.length > 0) {
                        const tracks = topData.tracks.items.map(track => ({
                            id: track.album.id, 
                            track_id: track.id,
                            title: track.name,
                            artist: track.artists.map(a => a.name).join(', '),
                            cover: track.album.images.length > 0 ? track.album.images[0].url : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
                            popularity: track.popularity
                        }));
                        allTopTracks = allTopTracks.concat(tracks);
                    }
                }
            } catch(e) {
                console.error("Errore fetch top tracks FIMI for " + artistName, e);
            }
            await new Promise(r => setTimeout(r, 50));
        }
        
        allTopTracks.sort((a, b) => b.popularity - a.popularity);
        let uniqueTracks = [];
        let seenIds = new Set();
        for (const t of allTopTracks) {
            if (!seenIds.has(t.track_id)) {
                seenIds.add(t.track_id);
                uniqueTracks.push(t);
            }
        }
        let top10Tracks = uniqueTracks.slice(0, 10).map((t, i) => {
            t.rank = i + 1;
            return t;
        });

        // 2. Trova l'album/singolo più recente tra gli artisti del roster
        const shuffled = [...SUPPORTED_ARTISTS].sort(() => 0.5 - Math.random());
        // Riduciamo a 4 artisti per non esplodere i rate limit (Spotify limita a raffiche brevi)
        const selectedArtists = shuffled.slice(0, 4);
        
        let latestReleases = [];
        
        for (const artistName of selectedArtists) {
            try {
                const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (searchRes.status === 429) {
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                const searchData = await searchRes.json();
                
                if (searchData.artists && searchData.artists.items.length > 0) {
                    const artist = searchData.artists.items[0];
                    const albumsRes = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&limit=1`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (albumsRes.status === 429) {
                        await new Promise(r => setTimeout(r, 1000));
                        continue;
                    }
                    
                    if (albumsRes.ok) {
                        const albumsData = await albumsRes.json();
                        if (albumsData.items && albumsData.items.length > 0) {
                            latestReleases.push({
                                id: albumsData.items[0].id,
                                title: albumsData.items[0].name,
                                artist: artist.name,
                                cover: albumsData.items[0].images?.[0]?.url,
                                release_date: albumsData.items[0].release_date
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("Errore fetch newest for " + artistName, e);
            }
            await new Promise(r => setTimeout(r, 150)); 
        }
        
        // Ordina per release_date decrescente
        latestReleases.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        
        const latestRelease = latestReleases.length > 0 ? latestReleases[0] : null;
        
        const finalData = {
            latestRelease: latestRelease,
            top10: top10Tracks
        };
        
        // Aggiorna Cache se la Top 10 ha almeno elementi
        if (top10Tracks.length > 0) {
            featuredContentCache = finalData;
            featuredContentCacheTime = Date.now();
        }
        
        res.json(finalData);
        
    } catch (err) {
        console.error("Errore featured-content:", err);
        // Dati Fallback d'emergenza
        res.json({
            latestRelease: { id: "1668997865", title: "Cenere", artist: "Lazza", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/bc/9f/95/bc9f95f4-3ea3-9d48-356a-2dfcd7fcceb2/23UMGIM08249.rgb.jpg/600x600bb.jpg" },
            top10: [
                { id: "1440864547", title: "Visiera A Becco", artist: "Sfera Ebbasta", cover: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/ac/b7/21/acb72195-e5bf-f6bd-5f1e-e886ea1cb6e7/00602557145502.rgb.jpg/600x600bb.jpg", rank: 1 }
            ]
        });
    }
});

app.get('/api/search-artist', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Manca parametro q' });
    try {
        const token = await getSpotifyToken();
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (searchRes.status === 429 || !searchRes.ok) {
            // Fallback iTunes
            const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&country=IT&limit=1`);
            const itunesData = await itunesRes.json();
            if (itunesData.results && itunesData.results.length > 0) {
                return res.json({ id: itunesData.results[0].artistId.toString(), name: itunesData.results[0].artistName });
            }
            return res.status(404).json({ error: 'Non trovato su iTunes' });
        }
        
        const data = await searchRes.json();
        if (data.artists && data.artists.items.length > 0) {
            return res.json({ id: data.artists.items[0].id, name: data.artists.items[0].name });
        }
        return res.status(404).json({ error: 'Non trovato su Spotify' });
    } catch (e) {
        return res.status(500).json({ error: 'Errore search-artist' });
    }
});

const artistCache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 ora

app.get('/api/spotify/artist', async (req, res) => {
  const artistId = req.query.id;
  if (!artistId) return res.status(400).json({ error: 'Parametro id mancante' });

  if (artistCache.has(artistId)) {
      const cached = artistCache.get(artistId);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
          return res.json(cached.data);
      }
  }

  let artistName = "";
  let spotifyArtistId = null;
  let artistImage = "";
  let itunesArtistIdFallback = null;
  let token = null;

  try {
      if (/^\d+$/.test(artistId)) {
          // E' un ID di iTunes (proveniente dal fallback)
          itunesArtistIdFallback = artistId;
          const itunesRes = await fetch(`https://itunes.apple.com/lookup?id=${artistId}&entity=musicArtist&country=IT`);
          const itunesData = await itunesRes.json();
          if (itunesData.results && itunesData.results.length > 0) {
              artistName = itunesData.results[0].artistName;
              
              // Tenta di recuperare l'immagine da Spotify usando il nome dell'artista
              try {
                  token = await getSpotifyToken();
                  const spotifySearchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (spotifySearchRes.ok) {
                      const sData = await spotifySearchRes.json();
                      if (sData.artists && sData.artists.items.length > 0) {
                          spotifyArtistId = sData.artists.items[0].id;
                          artistImage = sData.artists.items[0].images && sData.artists.items[0].images.length > 0 ? sData.artists.items[0].images[0].url : '';
                      }
                  }
              } catch(e) {
                  console.error("Errore recupero immagine Spotify per iTunes ID", e);
              }
              
          } else {
              return res.status(404).json({ error: 'Artista non trovato su iTunes' });
          }
      } else {
          // E' un ID di Spotify
          spotifyArtistId = artistId;
          token = await getSpotifyToken();
          const spotifyRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (spotifyRes.status === 429 || !spotifyRes.ok) {
              // SCRAPE FALLBACK: Tentiamo di aggirare il blocco raschiando la pagina pubblica di Spotify!
              try {
                  const scrapeRes = await fetch(`https://open.spotify.com/artist/${artistId}`);
                  if (scrapeRes.ok) {
                      const html = await scrapeRes.text();
                      const match = html.match(/<meta property="og:image" content="(.*?)"/);
                      if (match && match[1]) {
                          artistImage = match[1];
                          console.log("🎯 Immagine Spotify recuperata via scraping per: " + artistId);
                      }
                  }
              } catch (e) { console.error("Scraping fallback fallito", e); }

              if (req.query.name) {
                  console.log("⚠️ Spotify 429 su /artist, ma abbiamo il nome di salvataggio. Passo a iTunes per:", req.query.name);
                  artistName = req.query.name;
                  spotifyArtistId = null; // Forza il blocco iTunes più sotto
              } else {
                  return res.status(429).json({ error: 'Rate limit Spotify, impossibile recuperare i metadati artista' });
              }
          } else {
              const spotifyData = await spotifyRes.json();
              artistName = spotifyData.name;
              artistImage = spotifyData.images && spotifyData.images.length > 0 ? spotifyData.images[0].url : '';
          }
      }

    // 2. Cerca la Bio (Prima Genius perché è strettamente musicale ed evita omonimie con cose non musicali)
    let bio = "";
    
    try {
        const gSearchRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(artistName)}`, { headers: { Authorization: `Bearer ${GENIUS_TOKEN}` } });
        const gSearchData = await gSearchRes.json();
        if (gSearchData.response.hits && gSearchData.response.hits.length > 0) {
            // Cerca il match esatto per evitare feat o artisti simili
            const hit = gSearchData.response.hits.find(h => h.result.primary_artist.name.toLowerCase() === artistName.toLowerCase());
            if (hit) {
                const gArtistId = hit.result.primary_artist.id;
                const gBioRes = await fetch(`https://api.genius.com/artists/${gArtistId}?text_format=plain`, { headers: { Authorization: `Bearer ${GENIUS_TOKEN}` } });
                const gBioData = await gBioRes.json();
                
                // Fallback Immagine Artista: prendi la foto reale da Genius se Spotify ci blocca!
                if (!artistImage && gBioData.response?.artist?.image_url) {
                    artistImage = gBioData.response.artist.image_url;
                }

                let geniusBio = gBioData.response?.artist?.description?.plain || "";
                if (geniusBio !== "?" && geniusBio.length > 50) {
                    bio = geniusBio;
                }
            }
        }
    } catch (e) { console.error("Genius bio error", e); }

    // Fallback su Wikipedia se Genius non trova nulla di utile
    if (!bio) {
        try {
            // Cerchiamo prima con il nome base
            let wikiRes = await fetch(`https://it.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(artistName)}&format=json`);
            let wikiData = await wikiRes.json();
            let pages = wikiData.query?.pages;
            
            // Se non trova, proviamo ad aggiungere (rapper) o (cantante)
            if (!pages || Object.values(pages)[0].pageid === undefined || Object.values(pages)[0].extract?.includes("può riferirsi a")) {
                wikiRes = await fetch(`https://it.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(artistName + " (rapper)")}|${encodeURIComponent(artistName + " (cantante)")}&format=json`);
                wikiData = await wikiRes.json();
                pages = wikiData.query?.pages;
            }

            if (pages) {
                const validPages = Object.values(pages).filter(p => p.pageid !== undefined && p.extract && !p.extract.includes("può riferirsi a"));
                if (validPages.length > 0) {
                    const page = validPages[0];
                    let cleanText = page.extract.replace(/==+.*?==+/g, '').replace(/\n+/g, '\n\n').trim();
                    if (cleanText.length > 800) {
                        let lastDotIndex = cleanText.substring(0, 900).lastIndexOf('.');
                        bio = lastDotIndex > 0 ? cleanText.substring(0, lastDotIndex + 1) : cleanText.substring(0, 900) + "...";
                    } else {
                        bio = cleanText;
                    }
                }
            }
        } catch (e) { console.error("Wikipedia err", e); }
    }

    // 3. Recupera discografia completa e rigorosa
    const canzoni = [];
    const visti = new Set();
    
    function normalizeTrackName(name) {
        return name.toLowerCase()
                   .replace(/\s*-\s*radio edit\s*/i, '')
                   .replace(/\s*-\s*remastered.*\s*/i, '')
                   .replace(/\s*\(feat\..*\)\s*/i, '')
                   .replace(/\s*-\s*single\s*/i, '')
                   .replace(/[\(\)\[\]]/g, '')
                   .trim();
    }
    
    let allAlbums = [];
    // Spotify ha ridotto il limite massimo da 50 a 10 per questo endpoint
    let nextUrl = spotifyArtistId ? `https://api.spotify.com/v1/artists/${spotifyArtistId}/albums?include_groups=album,single,appears_on&limit=10&offset=0` : null;
    let fallbackTriggered = false;

    if (!nextUrl) fallbackTriggered = true; // Salta Spotify se abbiamo solo ID iTunes

    // Prendi tutti gli album paginati (fino a 50 pagine da 10 per supportare 500 risultati)
    let pagesFetched = 0;
    while (nextUrl && pagesFetched < 50 && !fallbackTriggered) {
      if (!token) {
          token = await getSpotifyToken();
      }
      let albumsRes = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      
      // Gestione intelligente del Rate Limit
      if (albumsRes.status === 429) {
          let retryAfter = albumsRes.headers.get('Retry-After') || 2;
          if (retryAfter > 3) {
              console.log(`Rate Limit troppo lungo (${retryAfter}s). Forzo fallback iTunes immediato.`);
              fallbackTriggered = true;
              break;
          }
          console.log(`Rate Limit su /albums. Attesa di ${retryAfter}s prima di riprovare...`);
          await new Promise(r => setTimeout(r, retryAfter * 1000));
          albumsRes = await fetch(nextUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      }

      if (albumsRes.status === 429 || !albumsRes.ok) {
        console.log("Errore critico su /albums in Spotify. Fallback iTunes attivato...");
        fallbackTriggered = true;
        break;
      }
      
      // Delay preventivo anti Rate Limit aumentato a 250ms
      await new Promise(r => setTimeout(r, 250));
      
      const albumsData = await albumsRes.json();
      if (albumsData && albumsData.items) {
          allAlbums = allAlbums.concat(albumsData.items);
          nextUrl = albumsData.next;
      } else {
          nextUrl = null;
      }
      pagesFetched++;
    }

    if (fallbackTriggered) {
        let trueItunesArtistId = itunesArtistIdFallback;
        if (!trueItunesArtistId) {
            try {
                let artistSearchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&country=IT&limit=1`);
                if (artistSearchRes.ok) {
                    const artistData = await artistSearchRes.json();
                    if (artistData.results.length > 0) {
                        trueItunesArtistId = artistData.results[0].artistId;
                    }
                }
            } catch (e) { console.error("Errore recupero artistId iTunes", e); }
        }
        
        let fallbackResults = [];
        
        // RECUPERO A: Album e singoli primari garantiti (usando il vero ID)
        if (trueItunesArtistId) {
            try {
                let lookupRes = await fetch(`https://itunes.apple.com/lookup?id=${trueItunesArtistId}&entity=album&limit=200&country=IT`);
                if (lookupRes.ok) {
                    const lookupData = await lookupRes.json();
                    fallbackResults.push(...lookupData.results.filter(r => r.wrapperType === 'collection'));
                }
            } catch (e) { console.error(e); }
        }
        // Deduplicazione base prima di processare
        const uniqueCollections = new Map();
        fallbackResults.forEach(item => {
            if (!uniqueCollections.has(item.collectionId)) {
                uniqueCollections.set(item.collectionId, item);
            }
        });

        Array.from(uniqueCollections.values()).forEach(item => {
            // Se l'ID di iTunes NON coincide col VERO artista, scartalo categoricamente per evitare omonimie
            if (!trueItunesArtistId || item.artistId.toString() !== trueItunesArtistId.toString()) {
                return;
            }
            
            let computedGroup = item.trackCount <= 3 ? 'single' : 'album';
            let titolo = item.collectionName;
            
            let cleanTitle = titolo.toLowerCase().replace(/\s*\(feat\..*?\)/g, '').replace(/\s*\(radio edit\)/g, '').trim();
            if (visti.has(cleanTitle)) return;
            visti.add(cleanTitle);

            canzoni.push({
                id: item.collectionId.toString(),
                titolo: titolo,
                artista: item.artistName,
                copertina: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
                album_group: computedGroup,
                release_date: item.releaseDate ? item.releaseDate.substring(0, 10) : ''
            });
        });

        // RECUPERO B: Featuring da iTunes (Rigido ed Esatto, potenziato per i titoli)
        // Siccome Spotify è in blocco (429) e iTunes NON fornisce ID array per i feat,
        // simuliamo un match "ID strict" separando accuratamente tutti gli artisti.
        try {
            let songSearchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=200&country=IT`);
            if (songSearchRes.ok) {
                const songData = await songSearchRes.json();
                songData.results.forEach(song => {
                    if (!song || !song.artistName) return;
                    
                    let targetLower = artistName.toLowerCase().trim();
                    
                    // 1. Array da artistName
                    let artistiDaNome = song.artistName.toLowerCase()
                                            .split(/[,&/]| feat\. | ft\. | featuring /)
                                            .map(s => s.trim());
                    
                    // 2. Array da trackName (estraiamo tutto quello che c'è dopo feat. fino alla parentesi)
                    let artistiDaTitolo = [];
                    let trackNameRaw = song.trackName || "";
                    let featMatch = trackNameRaw.toLowerCase().match(/(?:feat\.|ft\.|featuring)\s+([^\])]+)/);
                    if (featMatch) {
                        artistiDaTitolo = featMatch[1].split(/[,&/]/).map(s => s.trim());
                    }

                    // Uniamo tutti i possibili artisti
                    let tuttiGliArtisti = [...artistiDaNome, ...artistiDaTitolo];
                    
                    let isPrimary = tuttiGliArtisti.length > 0 && tuttiGliArtisti[0] === targetLower;
                    
                    // Condizione ferrea: l'artista non è il primo, ma il suo VERO nome esatto è nella lista
                    // Questo scarta automaticamente "Luca Lazza", "Lazzaretto" o simili.
                    if (!isPrimary && tuttiGliArtisti.includes(targetLower)) {
                        let trackName = song.trackName || "";
                        let cleanTitle = trackName.toLowerCase().replace(/\s*\(feat\..*?\)/g, '').replace(/\s*\(radio edit\)/g, '').trim();
                        if (!visti.has(cleanTitle)) {
                            visti.add(cleanTitle);
                            canzoni.push({
                                id: song.collectionId ? song.collectionId.toString() : (song.trackId ? song.trackId.toString() : ""),
                                track_id: song.trackId ? song.trackId.toString() : "",
                                titolo: trackName,
                                artista: song.artistName || "Sconosciuto",
                                copertina: song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '600x600bb') : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
                                album_group: 'appears_on',
                                release_date: song.releaseDate ? song.releaseDate.substring(0, 10) : ''
                            });
                        }
                    }
                });
            }
        } catch(e) { console.error("Errore recupero feats iTunes", e); }
    }
    
    const appearsOnAlbumIds = [];
    const appearsOnAlbumsMap = new Map();

    if (allAlbums.length > 0) {
      for (const item of allAlbums) {
          if (!item || !item.artists) continue; // Previene crash TypeError
          // Verifica severa: l'artista è il PRIMO artista di questo album?
          let isPrimary = item.artists.length > 0 && item.artists[0].id === spotifyArtistId;
          
          let computedGroup = item.album_group;
          if (isPrimary && computedGroup === 'appears_on') {
              // Correggi l'errore di Spotify che a volte mette i colab in appears_on
              computedGroup = item.album_type;
          } else if (!computedGroup) {
              computedGroup = isPrimary ? item.album_type : 'appears_on';
          }

          if (computedGroup === 'appears_on' || !isPrimary) {
              // È un featuring, salviamo l'id dell'album per cercare le singole tracce dopo
              if (!appearsOnAlbumsMap.has(item.id)) {
                  appearsOnAlbumIds.push(item.id);
                  appearsOnAlbumsMap.set(item.id, item);
              }
          } else {
              // È un suo album o singolo primario
              let normName = normalizeTrackName(item.name);
              if (!visti.has(normName)) {
                  visti.add(normName);
                  canzoni.push({
                    id: item.id,
                    titolo: item.name,
                    artista: item.artists.map(a => a.name).join(', '),
                    copertina: item.images.length > 0 ? item.images[0].url : '',
                    album_group: computedGroup,
                    release_date: item.release_date
                  });
              }
          }
      }
    }

    // Processa i featuring usando batch (MAX 20 ID per chiamata a /albums?ids=) per non superare i rate limit
    if (appearsOnAlbumIds.length > 0) {
        console.log(`Recupero tracce per ${appearsOnAlbumIds.length} album featuring in batch...`);
        const maxAlbums = appearsOnAlbumIds.slice(0, 400); // Fino a 400 album (20 batch) per includere tutto il catalogo
        
        for (let i = 0; i < maxAlbums.length; i += 20) {
            const batchIds = maxAlbums.slice(i, i + 20).join(',');
            let batchRes = await fetch(`https://api.spotify.com/v1/albums?ids=${batchIds}`, { headers: { 'Authorization': `Bearer ${token}` } });
            
            if (batchRes.status === 429) {
                let retryAfter = batchRes.headers.get('Retry-After') || 2;
                if (retryAfter > 3) {
                    console.warn(`Rate limit su /albums?ids troppo lungo (${retryAfter}s). Salto restanti batch.`);
                    break;
                }
                console.warn(`Rate limit su /albums?ids. Attesa di ${retryAfter}s...`);
                await new Promise(r => setTimeout(r, retryAfter * 1000));
                batchRes = await fetch(`https://api.spotify.com/v1/albums?ids=${batchIds}`, { headers: { 'Authorization': `Bearer ${token}` } });
            }

            if (batchRes.status === 429) {
                console.warn(`Ancora Rate limit. Salto i restanti.`);
                break;
            }
            
            // Delay preventivo anti Rate Limit
            await new Promise(r => setTimeout(r, 250));
            
            if (batchRes.ok) {
                const batchData = await batchRes.json();
                if (batchData.albums) {
                    for (const album of batchData.albums) {
                        try {
                            if (album && album.tracks && album.tracks.items) {
                                for (const track of album.tracks.items) {
                                    if (track && track.artists && track.artists.some(a => a && a.id === spotifyArtistId)) {
                                        let trackName = track.name || "";
                                        let normName = normalizeTrackName(trackName);
                                        if (!visti.has(normName)) {
                                            visti.add(normName);
                                            // Se è il primo artista della traccia, consideralo un suo 'single', altrimenti 'appears_on' (vero featuring)
                                            let trackGroup = (track.artists.length > 0 && track.artists[0].id === spotifyArtistId) ? 'single' : 'appears_on';
                                            canzoni.push({
                                                id: album.id, // Usa l'id dell'album per aprire album-detail.html
                                                track_id: track.id,
                                                titolo: trackName,
                                                artista: track.artists.map(a => a.name).join(', '),
                                                copertina: album?.images?.[0]?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
                                                album_group: trackGroup,
                                                release_date: album.release_date || ''
                                            });
                                        }
                                    }
                                }
                            }
                        } catch (innerErr) {
                            console.error("Errore recupero traccia in batch", innerErr);
                        }
                    }
                }
            }
        }
    }

    // Ordina tutto cronologicamente (più recenti prima)
    canzoni.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

    // Fallback Immagine Artista: se Spotify ci ha bloccato e l'immagine è vuota, 
    // usiamo la copertina del suo album o singolo più recente recuperato da iTunes!
    if (!artistImage && canzoni.length > 0) {
        const tracciaConCopertina = canzoni.find(c => c.copertina && c.copertina !== 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png');
        if (tracciaConCopertina) {
            artistImage = tracciaConCopertina.copertina;
        }
    }

    const responseData = {
      artistId: artistId,
      artistName: artistName,
      artistImage: artistImage,
      bio,
      canzoni
    };
    
    artistCache.set(artistId, { data: responseData, timestamp: Date.now() });
    res.json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel recupero dati artista' });
  }
});

app.get('/api/spotify/album', async (req, res) => {
  const albumId = req.query.id;
  if (!albumId) return res.status(400).json({ error: 'Parametro id mancante' });

  // Se l'ID è composto solo da numeri, è sicuramente un ID di iTunes (generato dal fallback)
  if (/^\d+$/.test(albumId)) {
      try {
          const itunesRes = await fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=song&country=IT`);
          const itunesData = await itunesRes.json();
          
          if (itunesData.results && itunesData.results.length > 0) {
              // Il primo risultato è l'album, i successivi sono le canzoni
              const albumInfo = itunesData.results.find(r => r.wrapperType === 'collection');
              let tracce = itunesData.results.filter(r => r.wrapperType === 'track');
              
              // Se iTunes restituisce un singolo ma omette i track data, forziamo il brano usando i dati della collection
              if (tracce.length === 0 && albumInfo) {
                  tracce.push({
                      trackId: albumInfo.collectionId,
                      trackName: albumInfo.collectionName.replace(/ - Single$/i, ''),
                      trackNumber: 1,
                      trackTimeMillis: 0,
                      previewUrl: null,
                      artistName: albumInfo.artistName
                  });
              }

              const coverUrl = albumInfo ? albumInfo.artworkUrl100.replace('100x100bb', '600x600bb') : '';
              
              return res.json({
                  id: albumId,
                  name: albumInfo ? albumInfo.collectionName : 'Album',
                  cover: coverUrl,
                  artist: albumInfo ? albumInfo.artistName : '',
                  artist_id: albumInfo && albumInfo.artistId ? albumInfo.artistId.toString() : null,
                  release_date: albumInfo && albumInfo.releaseDate ? albumInfo.releaseDate.substring(0, 10) : '',
                  total_tracks: tracce.length,
                  tracks: tracce.map((t, idx) => ({
                      id: t.trackId.toString(),
                      name: t.trackName,
                      track_number: t.trackNumber || (idx + 1),
                      duration_ms: t.trackTimeMillis,
                      preview_url: t.previewUrl || null,
                      artist: t.artistName,
                      artist_id: t.artistId ? t.artistId.toString() : null
                  }))
              });
          } else {
              return res.status(404).json({ error: 'Album non trovato su iTunes' });
          }
      } catch (err) {
          console.error(err);
          return res.status(500).json({ error: 'Errore nel recupero dati album da iTunes' });
      }
  }

  // Altrimenti procedi con la logica normale di Spotify
  try {
    const token = await getSpotifyToken();
    let response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Gestione rigorosa del Rate Limit per evitare errori e loop infiniti
    if (response.status === 429) {
        let retryAfter = response.headers.get('Retry-After') || 2;
        if (retryAfter > 3) {
            return res.status(429).json({ error: 'Rate limit Spotify troppo lungo.' });
        }
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
    }

    if (!response.ok) {
        return res.status(response.status).json({ error: 'Errore API Spotify' });
    }

    const data = await response.json();
    
    // Uso dell'optional chaining rigoroso per prevenire property di undefined
    res.json({
      id: data.id,
      name: data.name,
      cover: data?.images?.[0]?.url || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
      artist: data?.artists?.[0]?.name || 'Artista Sconosciuto',
      artist_id: data?.artists?.[0]?.id || null,
      release_date: data.release_date || '',
      tracks: (data.tracks?.items || []).map(t => ({
        id: t.id,
        name: t.name,
        preview_url: t.preview_url || null,
        artist: (t.artists || []).map(a => a.name).join(', '),
        artist_id: (t.artists && t.artists.length > 0) ? t.artists[0].id : null
      }))
    });
  } catch (err) {
    console.error("Errore nel recupero dell'album Spotify:", err);
    res.status(500).json({ error: 'Errore nel recupero dell\'album' });
  }
});

app.get('/api/spotify/track', async (req, res) => {
  const trackId = req.query.id;
  if (!trackId) return res.status(400).json({ error: 'Parametro id mancante' });

  // Se l'ID è composto solo da numeri, è un ID di iTunes
  if (/^\d+$/.test(trackId)) {
      try {
          const itunesRes = await fetch(`https://itunes.apple.com/lookup?id=${trackId}&entity=song&country=IT`);
          const itunesData = await itunesRes.json();
          if (itunesData.results && itunesData.results.length > 0) {
              const t = itunesData.results[0];
              return res.json({
                  id: trackId,
                  name: t.trackName,
                  artist: t.artistName,
                  artist_id: t.artistId ? t.artistId.toString() : null,
                  cover: t.artworkUrl100 ? t.artworkUrl100.replace('100x100bb', '600x600bb') : '',
                  album: t.collectionName,
                  preview_url: t.previewUrl || null,
                  duration_ms: t.trackTimeMillis
              });
          }
          return res.status(404).json({ error: 'Brano non trovato su iTunes' });
      } catch (err) {
          console.error(err);
          return res.status(500).json({ error: 'Errore nel recupero dati brano da iTunes' });
      }
  }

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
      artist_id: data.artists[0].id,
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
  const cleanTitle = title.replace(/\s*\(.*?\)/g, '').replace(/\s*\[.*?\]/g, '').trim();

  try {
    // 1. Tenta LRCLIB per i testi sincronizzati
    const lrclibRes = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(cleanTitle)}`);
    if (lrclibRes.ok) {
        const lrcData = await lrclibRes.json();
        if (lrcData.syncedLyrics) {
            return res.json({ synced: true, lyrics: lrcData.syncedLyrics });
        } else if (lrcData.plainLyrics) {
            return res.json({ synced: false, lyrics: lrcData.plainLyrics });
        }
    }
  } catch(e) {
    console.error("LRCLIB error", e);
  }

  try {
    // 2. Fallback su Genius se LRCLIB fallisce
    let queries = [`${title} ${artist}`, `${cleanTitle} ${artist}`];
    let hit = null;

    for (let q of queries) {
        const searchRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${process.env.GENIUS_TOKEN || 'T-2wzU3wTcwK8QYp0Pq9m0A88G41tB-1tU-B-l9D83G6C-fR8E0D71O-1Pz'}` }
        });
        const searchData = await searchRes.json();
        hit = searchData.response?.hits?.find(h => h.type === 'song');
        if (hit) break;
    }
    
    if (hit && hit.result.url) {
        const pageRes = await fetch(hit.result.url);
        const html = await pageRes.text();
        
        let lyrics = '';
        let parts = html.split('data-lyrics-container="true"');
        
        for (let i = 1; i < parts.length; i++) {
            let chunk = parts[i];
            let openDivs = 1;
            let j = chunk.indexOf('>') + 1;
            
            while (openDivs > 0 && j < chunk.length) {
                let nextOpen = chunk.indexOf('<div', j);
                let nextClose = chunk.indexOf('</div', j);
                
                if (nextClose === -1) break;
                
                if (nextOpen !== -1 && nextOpen < nextClose) {
                    openDivs++;
                    j = nextOpen + 4;
                } else {
                    openDivs--;
                    j = nextClose + 6;
                }
            }
            
            let containerHtml = chunk.substring(chunk.indexOf('>') + 1, j - 6);
            
            let text = containerHtml
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&#x27;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\u200B/g, '')
                .trim();
                
            lyrics += text + '\n\n';
        }
        
        if (lyrics.trim().length > 0) {
            // Pulisce l'intestazione indesiderata di Genius
            lyrics = lyrics.replace(/.*Contributors.*?Lyrics\s*\n*/i, '');
            // Rimuove i tag di sistema [Chorus], [Intro], ecc. per una UI pulita
            lyrics = lyrics.replace(/\[.*?\]/g, '');
            // Rimuove spazi vuoti eccessivi mantenendo le divisioni delle strofe
            lyrics = lyrics.replace(/\n{3,}/g, '\n\n');
            
            return res.json({ lyrics: lyrics.trim() });
        }
    }
    
    // Fallback su lyrics.ovh come ultima risorsa se Genius fallisce o non ha il testo
    const lyricsRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(cleanTitle)}`);
    if (lyricsRes.ok) {
        const data = await lyricsRes.json();
        if (data.lyrics) {
            let cleanOvh = data.lyrics.replace(/\[.*?\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
            return res.json({ lyrics: cleanOvh });
        }
    }
    
    res.json({ lyrics: "" });
  } catch (err) {
    console.error("Lyrics fetch error:", err);
    res.status(500).json({ error: 'Testo non trovato' });
  }
});

app.get('/api/discover-content', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        
        // 1. Fetch Categories
        let categories = [];
        try {
            const catRes = await fetch('https://api.spotify.com/v1/browse/categories?limit=20&country=IT', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (catRes.ok) {
                const catData = await catRes.json();
                categories = (catData.categories?.items || []).map(c => ({
                    id: c.id,
                    name: c.name,
                    icon: c.icons && c.icons.length > 0 ? c.icons[0].url : ''
                }));
            }
        } catch (e) { console.error("Errore fetch categorie:", e); }
        
        // Fallback categorie (hardcoded base)
        if (categories.length === 0) {
            categories = [
                { id: 'pop', name: 'Pop', icon: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80' },
                { id: 'rock', name: 'Rock', icon: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80' },
                { id: 'hiphop', name: 'Hip-Hop', icon: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80' },
                { id: 'dance', name: 'Dance/Elettronica', icon: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80' },
                { id: 'indie_alt', name: 'Indie', icon: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80' },
                { id: 'mood', name: 'Mood', icon: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80' }
            ];
        }

        // 2. Fetch Suggested Tracks (invece di New Releases) SOLO PER I TUOI ARTISTI
        let suggestedTracks = [];
        let spotlight = null;
        try {
            const SUPPORTED_ARTISTS = [
                "Lazza", "Sfera Ebbasta", "Shiva", "Capo Plaza", "Artie 5ive", "Kid Yugi", 
                "Tony Boy", "Ghali", "Travis Scott", "Playboi Carti", "Drake", "Future", 
                "Young Thug", "Metro Boomin", "Salmo", "Niky Savage", "Lil Cr", "Diss Gacha", 
                "Lil Baby", "Paky", "Baby Gang", "Tedua", "Tony Effe"
            ];

            // Peschiamo 15 artisti casuali dai supportati per dare varietà
            const shuffled = [...SUPPORTED_ARTISTS].sort(() => 0.5 - Math.random()).slice(0, 15);
            
            for (const artistName of shuffled) {
                // Delay per evitare il rate-limit (429) di Spotify
                await new Promise(resolve => setTimeout(resolve, 200));

                const topTracksRes = await fetch(`https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(artistName)}&type=track&limit=5`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (topTracksRes.ok) {
                    const tracksData = await topTracksRes.json();
                    if (tracksData.tracks && tracksData.tracks.items && tracksData.tracks.items.length > 0) {
                        const randomTrack = tracksData.tracks.items[Math.floor(Math.random() * tracksData.tracks.items.length)];
                        suggestedTracks.push({
                            id: randomTrack.id,
                            name: randomTrack.name,
                            artist: randomTrack.artists.map(a => a.name).join(', '),
                            cover: randomTrack.album && randomTrack.album.images && randomTrack.album.images.length > 0 ? randomTrack.album.images[0].url : ''
                        });
                    }
                }
            }
            
            suggestedTracks = suggestedTracks.sort(() => 0.5 - Math.random());
            
            if (suggestedTracks.length > 0) {
                spotlight = suggestedTracks.shift(); // Il primo elemento diventa lo spotlight
            }
            
        } catch (e) { console.error("Errore fetch suggested tracks:", e); }

        // Fallback robusto via iTunes RSS se Spotify ha bloccato tutte le richieste (Rate Limit / Token invalido)
        if (suggestedTracks.length === 0 && !spotlight) {
            try {
                const itunesRes = await fetch('https://itunes.apple.com/it/rss/topsongs/limit=15/json');
                if (itunesRes.ok) {
                    const itunesData = await itunesRes.json();
                    if (itunesData.feed && itunesData.feed.entry) {
                        const tracks = itunesData.feed.entry.map(entry => {
                            const idMatch = entry.id.attributes ? entry.id.attributes['im:id'] : null;
                            const coverArr = entry['im:image'];
                            return {
                                id: idMatch || entry.id.label,
                                name: entry['im:name'].label,
                                artist: entry['im:artist'].label,
                                cover: coverArr && coverArr.length > 0 ? coverArr[coverArr.length - 1].label.replace('55x55', '600x600') : ''
                            };
                        });
                        spotlight = tracks.shift();
                        suggestedTracks = tracks;
                    }
                }
            } catch (e) { console.error("Errore iTunes fallback tracks:", e); }
        }

        res.json({ categories, spotlight, suggestedTracks });
    } catch (err) {
        console.error("Errore endpoint discover:", err);
        res.status(500).json({ error: 'Impossibile caricare i dati discovery' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server attivo sulla porta ${PORT}`));