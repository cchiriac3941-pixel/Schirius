document.addEventListener('DOMContentLoaded', () => {
    fetchDiscoverContent();
});

async function fetchDiscoverContent() {
    try {
        const res = await fetch('/api/discover-content');
        if (!res.ok) throw new Error("Errore nel caricamento dei dati di discover");
        
        const data = await res.json();
        
        renderNewReleases(data.newReleases || []);
        renderCategories(data.categories || []);
        
    } catch (err) {
        console.error(err);
        document.getElementById('new-releases-container').innerHTML = '<p class="text-danger">Impossibile caricare le novità.</p>';
        document.getElementById('categories-container').innerHTML = '<p class="text-danger">Impossibile caricare i generi.</p>';
    }
}

function renderNewReleases(albums) {
    const container = document.getElementById('new-releases-container');
    container.innerHTML = '';
    
    if (albums.length === 0) {
        container.innerHTML = '<p class="text-white-50 ms-3">Nessun brano consigliato al momento.</p>';
        return;
    }
    
    albums.forEach(album => {
        const coverUrl = album.cover || 'https://via.placeholder.com/300?text=No+Cover';
        const link = `lyrics.html?id=${album.id}`;
        
        const html = `
            <a href="${link}" class="release-card new-release-card text-decoration-none">
                <img src="${coverUrl}" alt="${album.name}" loading="lazy">
                <div class="card-body text-truncate">
                    <h3 class="text-truncate" title="${album.name}">${album.name}</h3>
                    <p class="text-muted text-truncate" title="${album.artist}">${album.artist}</p>
                </div>
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
    
    categories.forEach(cat => {
        // Usa una placeholder se non c'è icona
        const iconUrl = cat.icon || `https://via.placeholder.com/300/1c1c1e/b026ff?text=${encodeURIComponent(cat.name)}`;
        
        // Per ora facciamo in modo che le categorie portino a una ricerca per quel genere
        const link = `../index.html?q=${encodeURIComponent(cat.name)}`;
        
        const html = `
            <a href="${link}" class="category-card">
                <img src="${iconUrl}" alt="${cat.name}" loading="lazy">
                <h3>${cat.name}</h3>
            </a>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}
