console.log("🟢 1. Il file app.js è stato caricato e letto dal browser!");

document.addEventListener('DOMContentLoaded', () => {
    console.log("🟢 2. L'HTML della pagina è pronto. Inizio la procedura...");

    // 1. Estrae il nome dell'artista dall'URL
    const params = new URLSearchParams(window.location.search);
    let artistName = params.get('artist');
    
    console.log("🟢 3. Nome artista trovato nell'URL:", artistName);

    // Se per qualche motivo l'URL è vuoto, facciamo un test con Sfera Ebbasta
    if (!artistName) {
        artistName = "Sfera Ebbasta";
        console.log("⚠️ Nessun artista nell'URL, forzo la ricerca per:", artistName);
    }

    document.getElementById('artist-name').textContent = artistName;

    // 2. Prepara l'indirizzo per il server
    const apiUrl = `http://localhost:3000/api/spotify/artist?artist=${encodeURIComponent(artistName)}`;
    console.log("🟢 4. Sto per chiamare il server a questo indirizzo:", apiUrl);

    // 3. Fa la chiamata al backend
    fetch(apiUrl)
        .then(response => {
            console.log("🟢 5. Il server ha risposto! Status Code:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("🟢 6. Dati ricevuti da Spotify:", data);
            
            const bioTesto = data.bio || "Nessuna biografia disponibile per questo artista.";
            const canzoni = data.canzoni || [];

            const artistBioEl = document.getElementById('artist-bio');
            if (artistBioEl) {
                artistBioEl.innerHTML = bioTesto.replace(/\n/g, '<br>');
            }

            const albumsContainer = document.getElementById('albums-container');
            const albumsSection = document.getElementById('albums-section');
            const singlesContainer = document.getElementById('singles-container');
            const singlesSection = document.getElementById('singles-section');
            const featuringContainer = document.getElementById('featuring-container');
            const featuringSection = document.getElementById('featuring-section');
            
            // Svuota i caricamenti precedenti
            if (albumsContainer) albumsContainer.innerHTML = '';
            if (albumsSection) albumsSection.style.display = 'none';
            if (singlesContainer) singlesContainer.innerHTML = '';
            if (singlesSection) singlesSection.style.display = 'none';
            if (featuringContainer) featuringContainer.innerHTML = '';
            if (featuringSection) featuringSection.style.display = 'none';

            let haAlbums = false;
            let haSingoli = false;
            let haFeaturing = false;

            const artistImg = document.getElementById('artist-img');
            if (artistImg && data.artistImage) {
                artistImg.src = data.artistImage;
                artistImg.style.display = 'block';
            }

            if (canzoni && canzoni.length > 0) {
                // Se l'immagine non era presente nel profilo, usa la copertina del primo brano
                if (artistImg && !data.artistImage && canzoni[0].copertina) {
                    artistImg.src = canzoni[0].copertina;
                    artistImg.style.display = 'block';
                }

                // Crea le card
                canzoni.forEach(canzione => {
                    const card = document.createElement('a');
                    // Il link ora va alla pagina dell'album usando un percorso relativo
                    card.href = `album-detail.html?id=${canzione.id}`;
                    card.className = 'release-card';
                    
                    const releaseDate = canzione.release_date ? `<p style="font-size: 0.75rem; color: #3b82f6; margin-top: 0.2rem;">${canzione.release_date.split('-')[0]}</p>` : '';
                    
                    card.innerHTML = `
                        <img src="${canzione.copertina}" alt="${canzione.titolo}">
                        <h4>${canzione.titolo}</h4>
                        <p>${canzione.artista}</p>
                        ${releaseDate}
                    `;
                    
                    // SMISTAMENTO (Spotify ci da 'album', 'single', 'appears_on')
                    if (canzione.album_group === 'appears_on') {
                        if (featuringContainer) featuringContainer.appendChild(card);
                        haFeaturing = true;
                    } else if (canzione.album_group === 'album') {
                        if (albumsContainer) albumsContainer.appendChild(card);
                        haAlbums = true;
                    } else {
                        if (singlesContainer) singlesContainer.appendChild(card);
                        haSingoli = true;
                    }
                });

                // Mostra le sezioni
                if (haAlbums && albumsSection) albumsSection.style.display = 'block';
                if (haSingoli && singlesSection) singlesSection.style.display = 'block';
                if (haFeaturing && featuringSection) featuringSection.style.display = 'block';

                console.log("🟢 7. Card generate con Spotify!");
            } else {
                if (singlesContainer) singlesContainer.innerHTML = '<p>Nessun contenuto trovato.</p>';
                if (singlesSection) singlesSection.style.display = 'block';
            }
        })
        .catch(error => {
            console.error("🔴 ERRORE CRITICO DURANTE IL RECUPERO DATI:", error);
        });
});

window.handleSearch = function() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    const artistaCercato = input.value.trim();

    if (artistaCercato !== "") {
        // Reindirizza alla stessa pagina ma cambiando il nome dell'artista nell'URL
        window.location.href = `/artists/performer/artist-detail.html?artist=${encodeURIComponent(artistaCercato)}`;
    }
}