/* ============================================================
   SCHIRIUS LYRICS — home.js
   Gestisce il caricamento dinamico di Album e Singoli consigliati
   sulla Home Page da una lista specifica di artisti.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Lista ristretta di artisti (ID Spotify scelti dal cliente)
    // 1qj1JdEqzWICn5FhH2dI7L = Shiva
    // 238y1dKPtMeFEpX3Y6HofP = Sfera Ebbasta (o 238y1dKPtMeFEpX3Y6H1Vr)
    // 4A3HqU2uD0l5QY4tUf2FfQ = thasup
    // 3g6cZkSotO1sYgEqxS3F2X = Geolier
    // 2bF9n419I3pB0m5y2pZ5A9 = Lazza
    const targetArtists = [
        { id: "1qj1JdEqzWICn5FhH2dI7L", name: "Shiva" },
        { id: "238y1dKPtMeFEpX3Y6HofP", name: "Sfera Ebbasta" },
        { id: "4A3HqU2uD0l5QY4tUf2FfQ", name: "thasup" },
        { id: "3g6cZkSotO1sYgEqxS3F2X", name: "Geolier" },
        { id: "2bF9n419I3pB0m5y2pZ5A9", name: "Lazza" }
    ];

    async function loadHomeRecommendations() {
        // Seleziona un artista a caso dalla lista
        const randomArtist = targetArtists[Math.floor(Math.random() * targetArtists.length)];
        
        try {
            const res = await fetch(`http://localhost:3000/api/spotify/artist?id=${encodeURIComponent(randomArtist.id)}&name=${encodeURIComponent(randomArtist.name)}`);
            if (!res.ok) throw new Error("Errore nel caricamento artista");
            const data = await res.json();
            
            if (data.canzoni && data.canzoni.length > 0) {
                renderHomeData(data.canzoni, randomArtist.name);
            } else {
                showError("Nessun brano trovato per l'artista consigliato.");
            }
        } catch (e) {
            console.error(e);
            showError("Errore di connessione al server.");
        }
    }

    function renderHomeData(tracks, artistName) {
        // Separa Album e Singoli
        const albums = tracks.filter(t => t.albumType === 'album');
        const singles = tracks.filter(t => t.albumType === 'single');

        // Se non ci sono album, usa il primo singolo come Hero
        const heroItem = albums.length > 0 ? albums[0] : singles[0];
        
        // Render Hero (Album Consigliato)
        const heroContainer = document.getElementById('recommended-album-container');
        if (heroContainer && heroItem) {
            heroContainer.innerHTML = `
                <h2 class="h4 mb-4 fw-bold">Album Consigliato</h2>
                <a href="pages/album-detail.html?id=${heroItem.albumId}&name=${encodeURIComponent(heroItem.albumName)}" class="text-decoration-none">
                    <div class="hero-card overflow-hidden d-flex flex-column flex-md-row text-center text-md-start" style="transition: transform 0.25s ease;">
                        <img src="${heroItem.coverUrl}" alt="${heroItem.albumName}" class="img-fluid" style="width: 100%; max-width: 350px; object-fit: cover;">
                        <div class="p-4 p-md-5 d-flex flex-column justify-content-center w-100">
                            <span class="badge rounded-pill bg-accent bg-opacity-75 text-white align-self-center align-self-md-start mb-3 px-3 py-2">In Evidenza</span>
                            <h3 class="display-5 fw-bold text-white mb-2">${heroItem.albumName}</h3>
                            <p class="fs-5 text-white-50 mb-0">${artistName}</p>
                        </div>
                    </div>
                </a>
            `;
        }

        // Seleziona fino a 4 singoli casuali (o i primi 4)
        const recommendedSingles = singles.sort(() => 0.5 - Math.random()).slice(0, 4);
        const singlesGrid = document.getElementById('recommended-singles-grid');
        
        if (singlesGrid) {
            if (recommendedSingles.length === 0) {
                document.getElementById('recommended-singles-container').style.display = 'none';
            } else {
                singlesGrid.innerHTML = '';
                recommendedSingles.forEach(single => {
                    const col = document.createElement('div');
                    col.className = 'col-6 col-md-3';
                    col.innerHTML = `
                        <a href="pages/lyrics.html?id=${single.id}&track=${encodeURIComponent(single.title)}&artist=${encodeURIComponent(artistName)}" class="release-card h-100 recommendation-card">
                            <div class="position-relative">
                                <img src="${single.coverUrl}" alt="${single.title}" loading="lazy">
                                <div class="play-overlay">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                            </div>
                            <div class="p-3">
                                <h4 title="${single.title}" class="mb-1">${single.title}</h4>
                                <p title="${artistName}" class="mb-0 text-white-50">${artistName}</p>
                            </div>
                        </a>
                    `;
                    singlesGrid.appendChild(col);
                });
            }
        }
    }

    function showError(msg) {
        const heroContainer = document.getElementById('recommended-album-container');
        if (heroContainer) {
            heroContainer.innerHTML = `<div class="alert alert-dark text-center">${msg}</div>`;
        }
    }

    loadHomeRecommendations();
});
