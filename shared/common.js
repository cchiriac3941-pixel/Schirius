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

function setupCursorGlow() {
  const cursor = document.createElement('div');
  cursor.className = 'cursor-glow';
  document.body.appendChild(cursor);

  window.addEventListener('mousemove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.style.opacity = '1';
  });

  window.addEventListener('mouseout', () => {
    cursor.style.opacity = '0';
  });
}

window.addEventListener('DOMContentLoaded', setupCursorGlow);
window.addEventListener('DOMContentLoaded', setupNavbarGlow);

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
window.handleMobileSearch = function() {
  const input = document.getElementById('mobileSearchInput');
  if (input && input.value.trim() !== '') {
    const artist = encodeURIComponent(input.value.trim());
    
    // Trova il percorso relativo alla radice del progetto
    let prefix = '';
    if (window.location.href.includes('/artists/performer/')) prefix = '../../';
    else if (window.location.href.includes('/artists/')) prefix = '../';
    else if (window.location.href.includes('/pages/')) prefix = '../../';
    
    // Naviga alla pagina di dettaglio
    window.location.href = prefix + 'artists/performer/artist-detail.html?artist=' + artist;
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

function handleSearch() {
  const input = document.getElementById('searchInput');
  if (input && input.value.trim() !== '') {
    const artist = encodeURIComponent(input.value.trim());
    
    // Trova il percorso relativo alla radice del progetto
    let prefix = '';
    if (window.location.href.includes('/artists/performer/')) prefix = '../../';
    else if (window.location.href.includes('/artists/')) prefix = '../';
    else if (window.location.href.includes('/pages/')) prefix = '../../';
    
    // Naviga alla pagina di dettaglio
    window.location.href = prefix + 'artists/performer/artist-detail.html?artist=' + artist;
  }
}
