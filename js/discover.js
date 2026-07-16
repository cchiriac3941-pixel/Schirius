document.addEventListener('DOMContentLoaded', () => {
    fetchDiscoverContent();
});

async function fetchDiscoverContent() {
    try {
        const res = await fetch('/api/discover-content');
        if (!res.ok) throw new Error("Errore nel caricamento dei dati di discover");
        
        const data = await res.json();
        
        renderSpotlight(data.spotlight);
        renderSuggested(data.suggestedTracks || []);
        renderCategories(data.categories || []);
        
    } catch (err) {
        console.error(err);
        document.getElementById('spotlight-container').innerHTML = '<p class="text-danger">Impossibile caricare il brano in evidenza.</p>';
        document.getElementById('suggested-container').innerHTML = '<p class="text-danger">Impossibile caricare i brani suggeriti.</p>';
        document.getElementById('categories-container').innerHTML = '<p class="text-danger">Impossibile caricare i generi.</p>';
    }
}

function renderSpotlight(track) {
    const container = document.getElementById('spotlight-container');
    container.innerHTML = '';
    
    if (!track) {
        container.innerHTML = '<p class="text-white-50 ms-3">Nessun brano consigliato al momento.</p>';
        return;
    }
    
    const coverUrl = track.cover || 'https://via.placeholder.com/800?text=No+Cover';
    const link = `lyrics.html?id=${track.id}`;
    
    const html = `
        <a href="${link}" class="spotlight-card">
            <div class="spotlight-badge">Hit Consigliata</div>
            <div class="spotlight-image-wrapper">
                <img src="${coverUrl}" alt="${track.name}" class="spotlight-img" loading="lazy">
            </div>
            <div class="spotlight-info">
                <h3 class="spotlight-title text-truncate" title="${track.name}">${track.name}</h3>
                <p class="spotlight-artist">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    ${track.artist}
                </p>
            </div>
        </a>
    `;
    container.insertAdjacentHTML('beforeend', html);
}

function renderSuggested(tracks) {
    const container = document.getElementById('suggested-container');
    container.innerHTML = '';
    
    if (tracks.length === 0) {
        container.innerHTML = '<p class="text-white-50 ms-3">Nessun brano trovato.</p>';
        return;
    }
    
    tracks.forEach(track => {
        const coverUrl = track.cover || 'https://via.placeholder.com/300?text=No+Cover';
        const link = `lyrics.html?id=${track.id}`;
        
        const html = `
            <a href="${link}" class="suggested-card">
                <img src="${coverUrl}" alt="${track.name}" class="suggested-cover" loading="lazy">
                <h3 class="suggested-title text-truncate" title="${track.name}">${track.name}</h3>
                <p class="suggested-artist text-truncate" title="${track.artist}">${track.artist}</p>
            </a>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function renderCategories(categories) {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-muted">Nessuna categoria disponibile.</p>';
        return;
    }
    
    // Array di colori al neon da assegnare casualmente se l'API non ha colori specifici
    const neonColors = [
        'rgba(176, 38, 255, 0.8)', // Viola
        'rgba(0, 240, 255, 0.8)',  // Ciano
        'rgba(255, 0, 102, 0.8)',  // Rosa fluo
        'rgba(57, 255, 20, 0.8)',  // Verde fluo
        'rgba(255, 204, 0, 0.8)',  // Giallo
        'rgba(255, 51, 0, 0.8)'    // Arancione/Rosso
    ];
    
    categories.forEach((cat, index) => {
        const color = neonColors[index % neonColors.length];
        
        // Per ora facciamo in modo che le categorie portino a una ricerca per quel genere
        const link = `../index.html?q=${encodeURIComponent(cat.name)}`;
        
        const html = `
            <a href="${link}" class="neon-category" style="--neon-color: ${color};">
                <div class="neon-shape" style="background: ${color};"></div>
                <h3>${cat.name}</h3>
            </a>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}
