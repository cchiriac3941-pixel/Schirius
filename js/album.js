const albumDetail = document.getElementById('albumDetail');
const albumTracks = document.getElementById('albumTracks');
const apiBase = 'https://itunes.apple.com';
const lyricsApiBase = 'https://api.lyrics.ovh/v1';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDuration(milliseconds) {
  if (!milliseconds) return '';
  const seconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function normalizeTrackName(name) {
  return String(name)
    .replace(/\s*\(feat\.[^)]+\)/i, '')
    .replace(/\s*\(ft\.[^)]+\)/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();
}

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

async function fetchAlbumTracks(collectionId) {
  const response = await fetch(`${apiBase}/lookup?id=${collectionId}&entity=song&country=IT`);
  if (!response.ok) throw new Error('Impossibile recuperare le tracce.');
  const data = await response.json();
  return data.results || [];
}

async function fetchLyrics(artist, title) {
  const cleanTitle = normalizeTrackName(title);
  const url = `${lyricsApiBase}/${encodeURIComponent(artist)}/${encodeURIComponent(cleanTitle)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Lyrics non trovate');
  const data = await response.json();
  return data.lyrics || 'Nessun testo disponibile per questa traccia.';
}

function renderAlbumPage(metadata, tracks) {
  const artwork = metadata.artworkUrl100 ? metadata.artworkUrl100.replace('100x100', '1200x1200') : '';
  albumDetail.innerHTML = `
    <div class="row g-4 align-items-center">
      <div class="col-xl-5">
        <div class="album-cover-large" style="background-image:url('${escapeHtml(artwork)}')"></div>
      </div>
      <div class="col-xl-7">
        <div class="glass p-4 shadow-sm">
          <span class="eyebrow">Dettaglio album</span>
          <h1 class="display-6 fw-bold mt-3 mb-3">${escapeHtml(metadata.collectionName)}</h1>
          <p class="text-muted mb-4">${escapeHtml(metadata.artistName)} · ${new Date(metadata.releaseDate).toLocaleDateString('it-IT')}</p>
          <div class="album-meta">
            <div class="meta-item"><strong>Genere:</strong> <span>${escapeHtml(metadata.primaryGenreName || 'Musica')}</span></div>
            <div class="meta-item"><strong>Tipo:</strong> <span>${escapeHtml(metadata.collectionType || 'Album')}</span></div>
            <div class="meta-item"><strong>Tracce:</strong> <span>${metadata.trackCount}</span></div>
            <div class="meta-item"><strong>Prezzo:</strong> <span>${metadata.collectionPrice ? metadata.collectionPrice + ' ' + metadata.currency : 'N/A'}</span></div>
          </div>
          <div class="audio-panel mt-4">
            <p class="player-label mb-2">Anteprima album</p>
            <p class="mb-0 text-white-50 audio-note">Seleziona una traccia dalla lista per ascoltare l’anteprima.</p>
          </div>
        </div>
      </div>
    </div>`;

  const trackList = tracks
    .filter(item => item.wrapperType === 'track')
    .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));

  const trackRows = trackList.map(track => {
    const previewUrl = track.previewUrl ? escapeHtml(track.previewUrl) : '';
    const itemArtist = escapeHtml(metadata.artistName);
    const itemTitle = escapeHtml(track.trackName);
    const lyricsId = `lyrics-${track.trackId || track.trackNumber || Math.random().toString(36).slice(2)}`;

    return `
      <div class="track-row">
        <div class="track-info">
          <strong>${track.trackNumber || ''}. ${itemTitle}</strong>
          <small>${escapeHtml(track.collectionName)} · ${formatDuration(track.trackTimeMillis)}</small>
        </div>
        <div class="play-preview">
          ${previewUrl
            ? `<audio controls preload="none" class="w-100"><source src="${previewUrl}" type="audio/mpeg">Il tuo browser non supporta l'audio.</audio>`
            : '<span class="text-muted">Anteprima non disponibile</span>'}
          <button type="button" class="btn btn-sm btn-outline-light lyrics-btn mt-3" data-artist="${itemArtist}" data-track="${itemTitle}" data-lyrics-id="${lyricsId}">Mostra lyrics</button>
        </div>
      </div>
      <div id="${lyricsId}" class="lyrics-panel d-none">
        <div class="lyrics-text">Clicca su "Mostra lyrics" per caricare il testo.</div>
      </div>`;
  }).join('');

  albumTracks.innerHTML = `
    <div class="glass p-4 shadow-sm">
      <h2 class="h4 mb-3">Tracce dell'album</h2>
      <div class="track-list">${trackRows}</div>
    </div>`;
}

async function handleLyricsClick(event) {
  const button = event.target.closest('.lyrics-btn');
  if (!button) return;

  const artist = button.dataset.artist;
  const track = button.dataset.track;
  const lyricsId = button.dataset.lyricsId;
  if (!artist || !track || !lyricsId) return;

  const panel = document.getElementById(lyricsId);
  if (!panel) return;

  const lyricsText = panel.querySelector('.lyrics-text');
  if (!lyricsText) return;

  if (!panel.classList.contains('d-none')) {
    panel.classList.add('d-none');
    return;
  }

  panel.classList.remove('d-none');
  if (lyricsText.dataset.loaded === 'true') return;

  lyricsText.textContent = 'Caricamento lyrics...';
  try {
    const lyrics = await fetchLyrics(artist, track);
    lyricsText.textContent = lyrics;
  } catch (error) {
    lyricsText.textContent = 'Lyrics non disponibili per questa traccia.';
  }
  lyricsText.dataset.loaded = 'true';
}

function renderError(message) {
  albumDetail.innerHTML = `<div class="alert alert-danger">${escapeHtml(message)}</div>`;
  albumTracks.innerHTML = '';
}

albumTracks.addEventListener('click', handleLyricsClick);

function setupNavbarGlow() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  navbar.addEventListener('mousemove', event => {
    const rect = navbar.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    navbar.style.setProperty('--navbar-x', `${x}%`);
    navbar.style.setProperty('--navbar-y', `${y}%`);
  });

  navbar.addEventListener('mouseleave', () => {
    navbar.style.setProperty('--navbar-x', '50%');
    navbar.style.setProperty('--navbar-y', '50%');
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  setupNavbarGlow();
  const params = getQueryParams();
  const collectionId = params.get('collectionId');

  if (!collectionId) {
    renderError('Parametri album mancanti. Torna alla home e seleziona un album.');
    return;
  }

  const query = new URLSearchParams({
    id: collectionId,
    entity: 'song',
    country: 'IT',
  }).toString();

  try {
    const response = await fetch(`${apiBase}/lookup?${query}`);
    if (!response.ok) throw new Error('Errore nella richiesta API.');
    const data = await response.json();
    const results = data.results || [];
    const metadata = results.find(item => item.wrapperType === 'collection');
    if (!metadata) {
      renderError('Album non trovato.');
      return;
    }
    renderAlbumPage(metadata, results);
  } catch (error) {
    console.error(error);
    renderError('Impossibile caricare i dettagli dell’album. Riprova più tardi.');
  }
});
