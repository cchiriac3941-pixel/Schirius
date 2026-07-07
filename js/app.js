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

  const searchBtn = document.getElementById('mobileSearchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const input = document.getElementById('searchInput');
      if (input) {
        input.focus();
        // on small screens ensure top logo area visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Sync active state on scroll
  const sections = ['#top', '#featuredSection', '#albumsSection'];
  const targets = sections.map(s => document.querySelector(s)).filter(Boolean);
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

window.addEventListener('DOMContentLoaded', setupBottomNav);
