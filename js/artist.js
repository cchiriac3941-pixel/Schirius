/* ============================================================
   SCHIRIUS LYRICS — artist.js
   Script per la cartella /artists (stessa cartella di artist.html,
   delle singole pagine artista e di performer.html).
   Richiede ../shared/common.js caricato prima.
   Pronto per la logica futura, es. caricare dinamicamente le
   uscite/featuring di un artista da un'API.
   ============================================================ */

document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.liquid-featured-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});
