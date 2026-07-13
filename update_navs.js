const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'pages/album-detail.html',
  'pages/artist-detail.html',
  'pages/artist.html',
  'pages/discover.html',
  'pages/featured.html',
  'pages/lyrics.html'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Rimuovi la mobile-top-nav
  content = content.replace(/<!-- Mobile Top Nav -->[\s\S]*?<\/nav>\s*/, '');

  const isIndex = file === 'index.html';
  const prefix = isIndex ? 'pages/' : '';
  const rootPrefix = isIndex ? '' : '../';

  const newHeader = `  <!-- iOS 26 Native Header -->
  <header class="ios-header">
    <div class="ios-header-inner">
      <a href="${rootPrefix}index.html" class="brand-logo text-decoration-none ios-brand">Schirius <span class="brand-subtitle">Lyrics</span></a>
      
      <nav class="ios-nav-links">
        <a href="${rootPrefix}index.html" class="${isIndex ? 'active' : ''}">Home</a>
        <a href="${isIndex ? 'pages/' : ''}featured.html" class="${file.includes('featured.html') ? 'active' : ''}">In evidenza</a>
        <a href="${isIndex ? 'pages/' : ''}discover.html" class="${file.includes('discover.html') ? 'active' : ''}">Scopri</a>
        <a href="${isIndex ? 'pages/' : ''}artist.html" class="${file.includes('artist.html') || file.includes('artist-detail') ? 'active' : ''}">Artisti</a>
      </nav>
      
      <div class="ios-actions">
        <form class="ios-search" onsubmit="event.preventDefault(); handleSearch();">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input id="searchInput" type="search" placeholder="Cerca artista, album..." aria-label="Cerca">
        </form>
        <!-- Theme toggle btn will be injected here by common.js -->
      </div>
    </div>
  </header>`;

  content = content.replace(/<nav class="navbar[\s\S]*?<\/nav>/, newHeader.trim());

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Navbars updated!');
