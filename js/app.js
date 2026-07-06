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
