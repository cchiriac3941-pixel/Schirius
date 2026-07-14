document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const albumId = params.get('id');

    if (!albumId) {
        document.getElementById('album-name').textContent = "Album non trovato";
        return;
    }
    document.getElementById('album-name').innerHTML = '<div class="skeleton skeleton-text" style="width: 60%;"></div>';

    const apiUrl = `/api/spotify/album?id=${albumId}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('album-name').innerHTML = "<div class='empty-state text-muted'>Nessun album trovato</div>";
                return;
            }

            document.getElementById('album-name').textContent = data.name;
            if (data.artist_id) {
                document.getElementById('album-artist').innerHTML = `<a href="artist-detail.html?id=${data.artist_id}" class="artist-link text-decoration-none" style="color: inherit;">${data.artist}</a> • ${data.release_date ? data.release_date.split('-')[0] : ""}`;
            } else {
                document.getElementById('album-artist').textContent = data.artist + " • " + (data.release_date ? data.release_date.split('-')[0] : "");
            }
            
            const coverEl = document.getElementById('album-cover');
            if (data.cover) {
                coverEl.src = data.cover;
                coverEl.style.display = 'block';
            }

            const tracklistContainer = document.getElementById('tracklist-container');
            tracklistContainer.innerHTML = '';

            data.tracks.forEach((track, index) => {
                const div = document.createElement('div');
                div.className = 'track-item';
                div.style.cursor = 'pointer';
                // Il link intero punta alla pagina lyrics.html
                div.onclick = (e) => {
                    // Previene la navigazione se abbiamo cliccato sul link dell'artista
                    if(e.target.closest('.artist-link')) return;
                    window.location.href = `lyrics.html?id=${track.id}`;
                };
                
                const artistHtml = track.artist_id 
                    ? `<a href="artist-detail.html?id=${track.artist_id}" class="artist-link text-decoration-none" style="color: inherit; position: relative; z-index: 2;">${track.artist}</a>` 
                    : track.artist;

                div.innerHTML = `
                    <div class="track-number">${index + 1}</div>
                    <div class="track-info">
                        <h4 class="track-title">${track.name}</h4>
                        <p class="track-artist">${artistHtml}</p>
                    </div>
                `;
                tracklistContainer.appendChild(div);
            });
        })
        .catch(err => console.error(err));
});
