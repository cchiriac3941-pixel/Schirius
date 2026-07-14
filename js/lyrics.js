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
            if (data.artist_id) {
                document.getElementById('track-artist').innerHTML = `<a href="artist-detail.html?id=${data.artist_id}" class="artist-link text-decoration-none" style="color: inherit;">${data.artist}</a>`;
            } else {
                document.getElementById('track-artist').textContent = data.artist;
            }
            document.getElementById('track-album').textContent = data.album;
            
            const coverEl = document.getElementById('track-cover');
            const bgBlurEl = document.getElementById('lyrics-bg-blur');
            
            if (data.cover) {
                coverEl.src = data.cover;
                coverEl.style.display = 'block';
                
                // Imposta la copertina come sfondo sfocato!
                if (bgBlurEl) {
                    bgBlurEl.style.backgroundImage = `url(${data.cover})`;
                }
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
            // CUSTOM AUDIO PLAYER LOGIC
            const customPlayBtn = document.getElementById('custom-play-btn');
            const iconPlay = document.getElementById('icon-play');
            const iconPause = document.getElementById('icon-pause');
            const progressBg = document.getElementById('progress-bg');
            const progressFill = document.getElementById('progress-fill');
            const timeCurrent = document.getElementById('time-current');
            
            if (customPlayBtn && audioPlayer) {
                // Formatting time helpers
                const formatTime = (seconds) => {
                    if (isNaN(seconds)) return "0:00";
                    const m = Math.floor(seconds / 60);
                    const s = Math.floor(seconds % 60);
                    return m + ":" + (s < 10 ? "0" : "") + s;
                };

                // Play / Pause toggle
                customPlayBtn.addEventListener('click', () => {
                    if (audioPlayer.paused) {
                        audioPlayer.play();
                    } else {
                        audioPlayer.pause();
                    }
                });

                // Update UI on play/pause
                audioPlayer.addEventListener('play', () => {
                    iconPlay.style.display = 'none';
                    iconPause.style.display = 'block';
                });

                audioPlayer.addEventListener('pause', () => {
                    iconPlay.style.display = 'block';
                    iconPause.style.display = 'none';
                });

                // Update progress bar
                audioPlayer.addEventListener('timeupdate', () => {
                    if (!audioPlayer.duration) return;
                    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                    progressFill.style.width = percent + '%';
                    timeCurrent.textContent = formatTime(audioPlayer.currentTime);
                });

                // Seek functionality
                if (progressBg) {
                    progressBg.addEventListener('click', (e) => {
                        const rect = progressBg.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const width = rect.width;
                        const percentage = clickX / width;
                        
                        if (audioPlayer.duration) {
                            audioPlayer.currentTime = percentage * audioPlayer.duration;
                        }
                    });
                }
            }

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
                const isSynced = data.synced;
                
                let linesData = [];
                if (isSynced) {
                    const lrcLines = data.lyrics.split('\n');
                    lrcLines.forEach(line => {
                        const match = line.match(/^\[(\d+):(\d+\.\d+)\](.*)/) || line.match(/^\[(\d+):(\d+)\](.*)/);
                        if (match) {
                            const m = parseInt(match[1]);
                            const s = parseFloat(match[2]);
                            const timeInSeconds = (m * 60) + s;
                            const text = match[3].trim();
                            if(text) {
                                linesData.push({ time: timeInSeconds, text: text });
                            }
                        }
                    });
                } else {
                    const lines = data.lyrics.split('\n').map(l => l.trim());
                    lines.forEach(line => {
                        if (line) linesData.push({ time: null, text: line });
                        else linesData.push({ time: null, text: '' });
                    });
                }
                
                lyricsContainer.innerHTML = '';
                const spans = [];
                
                linesData.forEach((ld) => {
                    if (ld.text) {
                        const span = document.createElement('span');
                        span.className = 'lyric-line';
                        span.textContent = ld.text;
                        if (ld.time !== null) span.dataset.time = ld.time;
                        lyricsContainer.appendChild(span);
                        spans.push(span);
                    } else {
                        lyricsContainer.appendChild(document.createElement('br'));
                    }
                });

                // Sync audio
                const audioPlayer = document.getElementById('audio-player');
                if (audioPlayer && spans.length > 0) {
                    audioPlayer.addEventListener('timeupdate', () => {
                        if (audioPlayer.paused) return;
                        const currentTime = audioPlayer.currentTime;
                        
                        let activeIndex = -1;
                        if (isSynced && spans[0].dataset.time) {
                            for (let i = 0; i < spans.length; i++) {
                                const t = parseFloat(spans[i].dataset.time);
                                if (currentTime >= t) {
                                    activeIndex = i;
                                } else {
                                    break;
                                }
                            }
                        } else {
                            if (!audioPlayer.duration) return;
                            const progress = audioPlayer.currentTime / audioPlayer.duration;
                            activeIndex = Math.floor(progress * spans.length);
                        }
                        
                        spans.forEach((s, idx) => {
                            if (idx === activeIndex) {
                                if (!s.classList.contains('active-line')) {
                                    s.classList.add('active-line');
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
