console.log("🟢 1. Il file app.js è stato caricato e letto dal browser!");

document.addEventListener('DOMContentLoaded', () => {
    console.log("🟢 2. L'HTML della pagina è pronto. Inizio la procedura...");

    async function initArtist() {
        const params = new URLSearchParams(window.location.search);
        let artistId = params.get('id');
        let fallbackName = params.get('name') || params.get('artist'); 
        
        document.getElementById('artist-name').textContent = "Caricamento...";
        const artistImg = document.getElementById('artist-img');

        // Se non c'è l'ID, cerchiamolo tramite l'API di ricerca (per evitare nomi testuali al backend)
        if (!artistId && fallbackName) {
            console.log("⚠️ Passato nome ma non ID. Cerco l'ID univoco per: ", fallbackName);
            try {
                const searchRes = await fetch(`/api/search-artist?q=${encodeURIComponent(fallbackName)}`);
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    artistId = searchData.id;
                    fallbackName = searchData.name || fallbackName;
                }
            } catch (e) {
                console.error("Errore nella ricerca dell'ID", e);
            }
        }

        if (!artistId) {
            artistId = "238y1dKPtMeFEpX3Y6H1Vr"; // Sfera Ebbasta ID fallback estremo
            fallbackName = "Sfera Ebbasta";
        }

        const apiUrl = `/api/spotify/artist?id=${encodeURIComponent(artistId)}&name=${encodeURIComponent(fallbackName || '')}`;
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            const artistNameEl = document.getElementById('artist-name');
            if (artistNameEl) {
                artistNameEl.textContent = data.artistName || fallbackName || "Artista Sconosciuto";
            }
            
            const bioTesto = data.bio || "Nessuna biografia disponibile per questo artista.";
            const canzoni = data.canzoni || [];

            const artistBioEl = document.getElementById('artist-bio');
            if (artistBioEl) {
                artistBioEl.innerHTML = bioTesto.replace(/\n/g, '<br>');
                
                if (bioTesto.length > 150) {
                    artistBioEl.style.display = '-webkit-box';
                    artistBioEl.style.webkitLineClamp = '4';
                    artistBioEl.style.webkitBoxOrient = 'vertical';
                    artistBioEl.style.overflow = 'hidden';
                    
                    const toggleBtn = document.createElement('a');
                    toggleBtn.href = '#';
                    toggleBtn.textContent = 'Mostra altro';
                    toggleBtn.style.color = 'rgba(255, 255, 255, 0.8)';
                    toggleBtn.style.textDecoration = 'underline';
                    toggleBtn.style.fontSize = '0.9rem';
                    toggleBtn.style.display = 'inline-block';
                    toggleBtn.style.marginTop = '5px';
                    
                    toggleBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        if (artistBioEl.style.webkitLineClamp === '4') {
                            artistBioEl.style.webkitLineClamp = 'unset';
                            toggleBtn.textContent = 'Mostra meno';
                        } else {
                            artistBioEl.style.webkitLineClamp = '4';
                            toggleBtn.textContent = 'Mostra altro';
                        }
                    });
                    
                    artistBioEl.parentNode.insertBefore(toggleBtn, artistBioEl.nextSibling);
                }
            }

            const albumsContainer = document.getElementById('albums-container');
            const albumsSection = document.getElementById('albums-section');
            const singlesContainer = document.getElementById('singles-container');
            const singlesSection = document.getElementById('singles-section');
            const featuringContainer = document.getElementById('featuring-container');
            const featuringSection = document.getElementById('featuring-section');
            
            if (albumsContainer) albumsContainer.innerHTML = '';
            if (albumsSection) albumsSection.style.display = 'none';
            if (singlesContainer) singlesContainer.innerHTML = '';
            if (singlesSection) singlesSection.style.display = 'none';
            if (featuringContainer) featuringContainer.innerHTML = '';
            if (featuringSection) featuringSection.style.display = 'none';

            let haAlbums = false;
            let haSingoli = false;
            let haFeaturing = false;

            // FOTO PROFILO E PLACEHOLDER
            if (artistImg) {
                artistImg.src = data.artistImage || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
                artistImg.style.display = 'block';
            }

            if (canzoni && canzoni.length > 0) {
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
        } catch (error) {
            console.error("🔴 ERRORE CRITICO DURANTE IL RECUPERO DATI:", error);
        }
    }
    
    initArtist();
});

window.handleSearch = function() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    const artistaCercato = input.value.trim();

    if (artistaCercato !== "") {
        // Reindirizza alla stessa pagina ma cambiando il nome dell'artista nell'URL
        window.location.href = `/pages/artist-detail.html?artist=${encodeURIComponent(artistaCercato)}`;
    }
}