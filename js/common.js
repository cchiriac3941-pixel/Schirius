/* ============================================================
   SCHIRIUS LYRICS — shared/common.js
   Script CONDIVISO da tutte le pagine: glow della navbar, glow
   del cursore, comportamento della bottom-nav mobile.
   Va incluso PRIMA dello script specifico della pagina (che vive
   nella cartella della pagina stessa).
   ============================================================ */

const navbar = document.querySelector('.navbar');

function setupNavbarGlow() {
  if (!navbar) return;

  navbar.addEventListener('mousemove', event => {
    const rect = navbar.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    navbar.style.setProperty('--navbar-x', `${x}%`);
    navbar.style.setProperty('--navbar-y', `${y}%`);
  });

  navbar.addEventListener('mouseleave', () => {
    navbar.style.setProperty('--navbar-x', '50%');
    navbar.style.setProperty('--navbar-y', '50%');
  });
}

window.addEventListener('DOMContentLoaded', setupNavbarGlow);

// Theme Init & Toggle Logic
function initTheme() {
  const savedTheme = localStorage.getItem('schirius_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('schirius_theme', newTheme);
}

function setupThemeToggle() {
  const toggleBtnHTML = `
    <!-- Sole per Light Mode (visibile quando in Dark) -->
    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
    <!-- Luna per Dark Mode (visibile quando in Light) -->
    <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  `;

  // --- UNIFIED IOS HEADER ---
  const iosActions = document.querySelector('.ios-actions');
  if (iosActions) {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle-btn';
    themeBtn.setAttribute('aria-label', 'Toggle Theme');
    themeBtn.innerHTML = toggleBtnHTML;
    themeBtn.addEventListener('click', toggleTheme);
    iosActions.appendChild(themeBtn);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupThemeToggle();
  setupNavbarGlow();
});

function setupBottomNav() {
  const bottom = document.querySelector('.bottom-nav');
  if (!bottom) return;

  const leftLinks = bottom.querySelectorAll('.left-group .nav-link');
  const rightLinks = bottom.querySelectorAll('.right-group .nav-link');
  const allLinks = [...leftLinks, ...rightLinks];

  allLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      allLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Inietta la logica e il bottone per il mobile search box se siamo su mobile
  const bottomNav = document.querySelector('.bottom-nav');
  if (bottomNav && !document.getElementById('mobileSearchBox')) {
    const searchBox = document.createElement('div');
    searchBox.id = 'mobileSearchBox';
    searchBox.className = 'mobile-search-box';
    searchBox.innerHTML = `
      <form onsubmit="event.preventDefault(); handleMobileSearch();">
        <input type="search" id="mobileSearchInput" placeholder="Cerca artista, album..." autocomplete="off">
        <button type="submit">⌕</button>
      </form>
    `;
    bottomNav.parentElement.appendChild(searchBox);
  }

  // Gestione comparsa barra ricerca mobile
  const searchBtn = document.getElementById('mobileSearchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const box = document.getElementById('mobileSearchBox');
      if (box) {
        box.classList.toggle('show');
        if (box.classList.contains('show')) {
          const input = document.getElementById('mobileSearchInput');
          if (input) {
            // Piccolo timeout per l'animazione
            setTimeout(() => input.focus(), 300);
          }
        }
      }
    });
  }
}

// Funzione globale per gestire la ricerca da mobile
window.handleMobileSearch = async function() {
  const input = document.getElementById('mobileSearchInput');
  if (input && input.value.trim() !== '') {
    const artist = encodeURIComponent(input.value.trim());
    
    // Trova il percorso relativo alla radice del progetto
    let prefix = '';
    if (window.location.href.includes('/artists/performer/')) prefix = '../../';
    else if (window.location.href.includes('/artists/')) prefix = '../';
    else if (window.location.href.includes('/pages/')) prefix = '../../';
    
    try {
        const res = await fetch('/api/search-artist?q=' + artist);
        const data = await res.json();
        if (data.id) {
            window.location.href = prefix + 'pages/artist-detail.html?id=' + encodeURIComponent(data.id) + '&name=' + encodeURIComponent(data.name || input.value.trim());
        } else {
            alert('Artista non trovato.');
        }
    } catch (e) {
        alert('Errore di ricerca.');
    }
  }
}

window.addEventListener('DOMContentLoaded', setupBottomNav);

// Sync active state on scroll
function setupScrollSync() {
  const sections = ['#top', '#featuredSection', '#albumsSection'];
  const targets = sections.map(s => document.querySelector(s)).filter(Boolean);
  const allLinks = document.querySelectorAll('.bottom-nav .nav-link');
  if (targets.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          allLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === id));
        }
      });
    }, { threshold: 0.45 });
    targets.forEach(t => io.observe(t));
  }
}

window.addEventListener('DOMContentLoaded', setupScrollSync);

window.handleSearch = async function() {
  const input = document.getElementById('searchInput');
  if (input && input.value.trim() !== '') {
    const artist = encodeURIComponent(input.value.trim());
    
    // Trova il percorso relativo alla radice del progetto
    let prefix = '';
    if (window.location.href.includes('/artists/performer/')) prefix = '../../';
    else if (window.location.href.includes('/artists/')) prefix = '../';
    else if (window.location.href.includes('/pages/')) prefix = '../../';
    
    try {
        const res = await fetch('/api/search-artist?q=' + artist);
        const data = await res.json();
        if (data.id) {
            window.location.href = prefix + 'pages/artist-detail.html?id=' + encodeURIComponent(data.id) + '&name=' + encodeURIComponent(data.name || input.value.trim());
        } else {
            alert('Artista non trovato.');
        }
    } catch (e) {
        alert('Errore di ricerca.');
    }
  }
}


// ==========================================
// PAGE TRANSITIONS (iOS 26)
// ==========================================
function setupPageTransitions() {
    document.body.classList.add('page-transition');
    
    // Add entered state slightly after load
    setTimeout(() => {
        document.body.classList.add('page-entered');
    }, 50);

    // Fade out on link click
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !link.hasAttribute('target')) {
                e.preventDefault();
                document.body.classList.remove('page-entered');
                setTimeout(() => {
                    window.location.href = href;
                }, 400); // Wait for transition
            }
        });
    });
}
window.addEventListener('DOMContentLoaded', setupPageTransitions);

// ==========================================
// GLOBAL IMAGE ERROR FALLBACK (Apple Empty State)
// ==========================================
window.addEventListener('error', function(e) {
    if (e.target.tagName && e.target.tagName.toLowerCase() === 'img') {
        e.target.onerror = null;
        // Sostituisce l'immagine rotta con un placeholder CSS via inline style
        e.target.style.background = 'linear-gradient(135deg, rgba(30,30,32,1) 0%, rgba(176,38,255,0.2) 100%)';
        e.target.style.objectFit = 'contain';
        // Genera un SVG in base64 al volo con il logo Schirius
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="20" fill="rgba(255,255,255,0.5)">Schirius</text></svg>';
        e.target.src = "data:image/svg+xml;base64," + btoa(svg);
    }
}, true);
