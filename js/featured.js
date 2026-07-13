/* ============================================================
   SCHIRIUS LYRICS — featured.js
   Script SOLO per pages/featured/featured.html (stessa cartella).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedData();
});

async function fetchFeaturedData() {
    const heroContainer = document.getElementById('hero-container');
    const top10Container = document.getElementById('top10-container');

    try {
        const response = await fetch('/api/featured-content');
        const data = await response.json();
        
        const heroItem = data.latestRelease;
        const top10 = data.top10 || [];

        if (!heroItem && top10.length === 0) {
            heroContainer.innerHTML = '<h4 class="text-center">Nessun contenuto in evidenza al momento.</h4>';
            return;
        }

        if (heroItem) {
            heroContainer.innerHTML = `
                <div class="row align-items-center text-start">
                  <div class="col-md-4 mb-4 mb-md-0 position-relative">
                    <img src="${heroItem.cover}" alt="Cover" class="img-fluid rounded-2 shadow-md" style="height: 250px; object-fit: cover; width: 100%;">
                    <div class="position-absolute top-50 start-50 translate-middle play-overlay-hero d-flex align-items-center justify-content-center" style="width:60px; height:60px; background:rgba(0,0,0,0.5); border-radius:50%; backdrop-filter:blur(5px);">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  <div class="col-md-8 ps-md-4">
                    <span class="badge mb-3" style="background: var(--accent);">Ultima Uscita</span>
                    <h2 class="h1 mb-2 fw-bold text-white" style="text-shadow: 0 0 20px rgba(176,38,255,0.5);">${heroItem.title}</h2>
                    <p class="text-white-50 mb-3 fs-5">${heroItem.artist}</p>
                    <p class="mb-4 text-white-75">Ascolta la release più recente in assoluto tra gli artisti supportati dal portale.</p>
                    <a href="album-detail.html?id=${heroItem.id}" class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm" style="background: var(--accent); border: none;">Ascolta Ora</a>
                  </div>
                </div>
            `;
        } else {
            heroContainer.innerHTML = '<h4 class="text-center">Ultima uscita non disponibile.</h4>';
        }

        top10Container.innerHTML = '';

        top10.forEach((item, index) => {
            // Fake play count per mantenere l'estetica, ma il rank è reale
            const playCount = (Math.random() * (5 - 1) + 1).toFixed(2); 
            
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-6';
            col.innerHTML = `
              <div class="music-card glass p-4 rounded-3 shadow-sm h-100 cursor-pointer transition-all hover-lift position-relative" onclick="window.location.href='album-detail.html?id=${item.id}'">
                <div class="d-flex align-items-center mb-3">
                  <div class="rank-badge bg-gradient me-3 d-flex align-items-center justify-content-center shadow-sm" style="width: 45px; height: 45px; border-radius: 12px; font-weight: 800; font-size: 1.2rem;">${item.rank || (index + 1)}</div>
                  <img src="${item.cover}" alt="Track" class="rounded-3 shadow-sm" style="width: 65px; height: 65px; object-fit: cover;">
                </div>
                <h5 class="mb-1 text-truncate" title="${item.title}"><a href="album-detail.html?id=${item.id}" class="text-white text-decoration-none stretched-link fw-bold">${item.title}</a></h5>
                <p class="text-white-50 small mb-3 text-truncate" title="${item.artist}">${item.artist}</p>
                <div class="d-flex justify-content-between align-items-center mt-auto">
                  <span class="badge" style="background: rgba(255,255,255,0.1); color: #e9d5ff;">Top 50 Italia</span>
                  <button class="btn btn-sm btn-link text-white position-relative p-0" style="z-index:2;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
              </div>
            `;
            top10Container.appendChild(col);
        });

    } catch (err) {
        console.error("Errore fetch featured:", err);
        heroContainer.innerHTML = '<h4 class="text-center text-danger">Impossibile caricare le novità in evidenza.</h4>';
        top10Container.innerHTML = '';
    }
}
