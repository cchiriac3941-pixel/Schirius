document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const albumId = params.get('id');

    if (!albumId) {
        document.getElementById('album-name').textContent = "Album non trovato";
        return;
    }

    const apiUrl = `/api/spotify/album?id=${albumId}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('album-name').textContent = "Errore nel caricamento";
                return;
            }

            document.getElementById('album-name').textContent = data.name;
            document.getElementById('album-artist').textContent = data.artist + " • " + (data.release_date ? data.release_date.split('-')[0] : "");
            
            const coverEl = document.getElementById('album-cover');
            if (data.cover) {
                coverEl.src = data.cover;
                coverEl.style.display = 'block';
            }

            const tracklistContainer = document.getElementById('tracklist-container');
            tracklistContainer.innerHTML = '';

            data.tracks.forEach((track, index) => {
                const a = document.createElement('a');
                a.className = 'track-item';
                // Il link punta alla pagina lyrics.html
                a.href = `lyrics.html?id=${track.id}`;
                
                a.innerHTML = `
                    <div class="track-number">${index + 1}</div>
                    <div class="track-info">
                        <h4 class="track-title">${track.name}</h4>
                        <p class="track-artist">${track.artist}</p>
                    </div>
                `;
                tracklistContainer.appendChild(a);
            });
        })
        .catch(err => console.error(err));
});
