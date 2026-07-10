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

function cercaTesto(artista, titolo) {
    const lyricsUrl = `/api/lyrics?artist=${encodeURIComponent(artista)}&title=${encodeURIComponent(titolo)}`;
    
    fetch(lyricsUrl)
        .then(res => res.json())
        .then(data => {
            const lyricsContainer = document.getElementById('lyrics-container');
            if (data.lyrics) {
                lyricsContainer.textContent = data.lyrics;
            } else {
                lyricsContainer.textContent = "Testo non trovato. Riprova più tardi.";
            }
        })
        .catch(err => {
            document.getElementById('lyrics-container').textContent = "Errore durante il recupero del testo.";
        });
}
