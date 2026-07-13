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
        try {
            const res = await fetch(`/api/home-recommendations`);
            if (!res.ok) throw new Error("Errore nel caricamento raccomandazioni");
            const data = await res.json();
            
            if (data && data.length > 0) {
                renderHomeData(data);
            } else {
                showError("Nessun brano trovato.");
            }
        } catch (e) {
            console.error(e);
            showError("Errore di connessione al server.");
        }
    }

    function renderHomeData(recommendations) {
        // Il primo elemento è l'Album (Hero), i restanti 4 sono Singoli (Grid)
        const heroItem = recommendations.length > 0 ? recommendations[0] : null;
        
        // Render Hero (Album Consigliato)
        const heroContainer = document.getElementById('recommended-album-container');
        if (heroContainer && heroItem) {
            heroContainer.innerHTML = `
                <h2 class="h4 mb-4 fw-bold">Album Consigliato</h2>
                <a href="pages/album-detail.html?id=${heroItem.id}&name=${encodeURIComponent(heroItem.title)}" class="text-decoration-none">
                    <div class="hero-card overflow-hidden d-flex flex-column flex-md-row text-center text-md-start" style="transition: transform 0.25s ease;">
                        <img src="${heroItem.cover}" alt="${heroItem.title}" class="img-fluid" style="width: 100%; max-width: 350px; object-fit: cover;">
                        <div class="p-4 p-md-5 d-flex flex-column justify-content-center w-100">
                            <span class="badge rounded-pill bg-accent bg-opacity-75 text-white align-self-center align-self-md-start mb-3 px-3 py-2">In Evidenza</span>
                            <h3 class="display-5 fw-bold text-white mb-2">${heroItem.title}</h3>
                            <p class="fs-5 text-white-50 mb-0">${heroItem.artist}</p>
                        </div>
                    </div>
                </a>
            `;
        }

        // Render Singoli Consigliati
        const singlesGrid = document.getElementById('recommended-singles-grid');
        if (singlesGrid) {
            singlesGrid.innerHTML = '';
            // Prendi i primi 4 singoli (escludendo quello usato come hero se necessario)
            let recommendedSingles = recommendations.slice(1);

            if (recommendedSingles.length > 0) {
                recommendedSingles.forEach(single => {
                    const col = document.createElement('div');
                    col.className = 'col-6 col-md-3 mb-4';
                    col.innerHTML = `
                        <a href="pages/lyrics.html?id=${single.id}&track=${encodeURIComponent(single.title)}&artist=${encodeURIComponent(single.artist)}" class="release-card h-100 recommendation-card">
                            <div class="position-relative">
                                <img src="${single.cover}" alt="${single.title}" loading="lazy">
                                <div class="play-overlay">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                            </div>
                            <div class="p-3">
                                <h4 title="${single.title}" class="mb-1">${single.title}</h4>
                                <p title="${single.artist}" class="mb-0 text-white-50">${single.artist}</p>
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
