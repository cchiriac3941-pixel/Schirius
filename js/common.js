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

function setupGlobalCardGlow() {
  document.addEventListener('mousemove', e => {
    // Seleziona tutte le card interattive che supportano l'effetto Liquid Glass
    const cards = document.querySelectorAll('.card, .hero-card, .release-card, .recommendation-card, .liquid-featured-card');
    
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setupNavbarGlow();
  setupGlobalCardGlow();
});

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
// LIQUID GLASS NAV ENGINE (iOS 26)
// ==========================================
function setupLiquidNav() {
    const containers = [
        { parent: document.querySelector('.ios-nav-links'), items: document.querySelectorAll('.ios-nav-links a') },
        { parent: document.querySelector('.bottom-inner'), items: document.querySelectorAll('.bottom-nav .nav-link') }
    ];

    containers.forEach(({ parent, items }) => {
        if (!parent || items.length === 0) return;

        // Inietta l'indicatore liquido
        const indicator = document.createElement('div');
        indicator.className = 'liquid-indicator';
        parent.appendChild(indicator);

        // Posizione iniziale
        const activeItem = Array.from(items).find(item => item.classList.contains('active')) || items[0];
        
        function updateIndicator(target, animate = true) {
            if (!target) return;
            const targetRect = target.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();
            
            // Per permettere l'effetto "stretch", non usiamo solo la width, ma gestiamo offset
            const left = targetRect.left - parentRect.left;
            const width = targetRect.width;

            if (!animate) indicator.style.transition = 'none';
            else indicator.style.transition = 'all 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6)';

            indicator.style.left = `${left}px`;
            indicator.style.width = `${width}px`;
        }

        // Posiziona all'avvio senza animazione
        updateIndicator(activeItem, false);
        window.addEventListener('resize', () => updateIndicator(parent.querySelector('.active'), false));

        // Gestione clic (Liquid slide + squeeze prima del cambio pagina)
        items.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (!href || href.startsWith('#') || link.hasAttribute('target')) return;
                
                e.preventDefault();
                
                // Rimuove active vecchio, aggiunge nuovo
                items.forEach(i => i.classList.remove('active'));
                link.classList.add('active');

                // Anima l'indicatore
                updateIndicator(link, true);

                // Effetto squeeze (micro-aptico)
                link.style.transform = 'scale(0.92)';
                indicator.style.transform = 'scale(0.92)';
                setTimeout(() => {
                    link.style.transform = '';
                    indicator.style.transform = '';
                }, 150);

                // Attendi che l'animazione Liquid Glass finisca prima di saltare
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        });
    });
}

// ==========================================
// PAGE TRANSITIONS (Removed as requested)
// ==========================================
function setupPageTransitions() {
    // Transizioni annullate
}

window.addEventListener('DOMContentLoaded', () => {
    setupPageTransitions();
    setTimeout(setupLiquidNav, 100); // Aspetta che il layout sia stabile
});


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

// ==========================================
// NAVBAR SCROLL STATE & AUTOCOMPLETE
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // 1. Scrolled State per Navbar
    const iosHeader = document.querySelector('.ios-header');
    if (iosHeader) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                iosHeader.classList.add('scrolled');
            } else {
                iosHeader.classList.remove('scrolled');
            }
        });
    }

    // 2. Autocomplete Live Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Crea il container del dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        
        // Inseriscilo sotto all'input
        searchInput.parentNode.style.position = 'relative';
        searchInput.parentNode.appendChild(dropdown);

        let debounceTimer;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(debounceTimer);
            
            if (query.length < 2) {
                dropdown.classList.remove('show');
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const risultati = await res.json();
                        
                        if (risultati.length === 0) {
                            dropdown.innerHTML = '<div class="p-3 text-muted">Nessun risultato trovato.</div>';
                        } else {
                            dropdown.innerHTML = risultati.map(item => {
                                const url = item.type === 'artist' ? `/pages/artist.html?id=${item.id}` : `/pages/album-detail.html?id=${item.id}`;
                                const badgeClass = item.type === 'artist' ? 'badge-artist' : 'badge-track';
                                const badgeText = item.type === 'artist' ? 'Artista' : 'Brano';
                                
                                return `
                                    <a href="${url}" class="autocomplete-item">
                                        <img src="${item.copertina || 'https://via.placeholder.com/48'}" alt="${item.titolo}">
                                        <div class="info">
                                            <strong>${item.titolo}</strong>
                                            <small>${item.artista}</small>
                                        </div>
                                        <span class="autocomplete-badge ${badgeClass}">${badgeText}</span>
                                    </a>
                                `;
                            }).join('');
                        }
                        dropdown.classList.add('show');
                    }
                } catch (err) {
                    console.error("Errore autocomplete:", err);
                }
            }, 300); // 300ms debounce
        });

        // Chiudi il dropdown se clicchi fuori
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Riapri il dropdown se clicchi sull'input e c'è del testo
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length >= 2 && dropdown.innerHTML !== '') {
                dropdown.classList.add('show');
            }
        });
    }
});

// ==========================================
// PWA SERVICE WORKER REGISTRATION
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
