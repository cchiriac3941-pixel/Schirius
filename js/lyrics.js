document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('id');

    if (!trackId) {
        document.getElementById('track-name').textContent = "Traccia non trovata";
        return;
    }

    const apiUrl = `/api/spotify/track?id=${trackId}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('track-name').textContent = "Errore nel caricamento";
                return;
            }

            document.getElementById('track-name').textContent = data.name;
            document.getElementById('track-artist').textContent = data.artist;
            document.getElementById('track-album').textContent = data.album;
            
            const coverEl = document.getElementById('track-cover');
            if (data.cover) {
                coverEl.src = data.cover;
                coverEl.style.display = 'block';
            }

            const spotifyLink = document.getElementById('spotify-link');
            if (data.spotify_url) {
                spotifyLink.href = data.spotify_url;
                spotifyLink.style.display = 'inline-block';
            }

            const audioWrapper = document.getElementById('audio-wrapper');
            const audioPlayer = document.getElementById('audio-player');
            if (data.preview_url) {
                audioPlayer.src = data.preview_url;
                audioWrapper.style.display = 'block';
            } else {
                audioWrapper.innerHTML = '<p class="text-white-50 mt-3">Anteprima audio non disponibile per questa traccia.</p>';
                audioWrapper.style.display = 'block';
            }

            // Dopo aver recuperato i dettagli, cerchiamo il testo
            cercaTesto(data.artist, data.name);
        })
        .catch(err => console.error(err));
});

function cleanTrackTitle(title) {
    return title
        .replace(/\s*\([^)]*(feat\.|ft\.|with|remastered|live|version|edit|remix|acoustic|radio)[^)]*\)/gi, '')
        .replace(/\s*-\s*(remastered|live|version|edit|remix|acoustic|radio|feat\.|ft\.).*/gi, '')
        .trim();
}

function cercaTesto(artista, titolo) {
    const cleanTitolo = cleanTrackTitle(titolo);
    const lyricsUrl = `/api/lyrics?artist=${encodeURIComponent(artista)}&title=${encodeURIComponent(cleanTitolo)}`;
    
    const fallbackHTML = `
        <div style="text-align: center; padding: 40px 20px; opacity: 0.6; white-space: normal;">
            <h4 style="font-weight: 500; margin-bottom: 10px; font-size: 1.3rem;">Il testo di questo brano non è ancora disponibile.</h4>
            <p style="font-size: 0.95rem; margin: 0;">Stiamo lavorando per aggiungerlo al nostro database.</p>
        </div>
    `;
    
    fetch(lyricsUrl)
        .then(res => res.json())
        .then(data => {
            const lyricsContainer = document.getElementById('lyrics-container');
            if (data.lyrics) {
                const lines = data.lyrics.split('\n').map(line => line.trim());
                lyricsContainer.innerHTML = ''; // Svuota il contenitore
                const spans = [];
                
                lines.forEach(line => {
                    if (line) {
                        const span = document.createElement('span');
                        span.className = 'lyric-line';
                        span.textContent = line;
                        lyricsContainer.appendChild(span);
                        spans.push(span);
                    } else {
                        // Spazio vuoto
                        lyricsContainer.appendChild(document.createElement('br'));
                    }
                });

                // Sync audio (stima lineare basata sull'anteprima da 30s)
                const audioPlayer = document.getElementById('audio-player');
                if (audioPlayer && spans.length > 0) {
                    audioPlayer.addEventListener('timeupdate', () => {
                        if (!audioPlayer.duration || audioPlayer.paused) return;
                        
                        const progress = audioPlayer.currentTime / audioPlayer.duration;
                        const activeIndex = Math.floor(progress * spans.length);
                        
                        spans.forEach((s, idx) => {
                            if (idx === activeIndex) {
                                if (!s.classList.contains('active-line')) {
                                    s.classList.add('active-line');
                                    // Scroll morbido per centrare la riga illuminata
                                    s.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            } else {
                                s.classList.remove('active-line');
                            }
                        });
                    });
                }
            } else {
                lyricsContainer.style.whiteSpace = 'normal';
                lyricsContainer.innerHTML = fallbackHTML;
            }
        })
        .catch(err => {
            const lyricsContainer = document.getElementById('lyrics-container');
            lyricsContainer.style.whiteSpace = 'normal';
            lyricsContainer.innerHTML = fallbackHTML;
        });
}
