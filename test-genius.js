const fs = require('fs');
(async () => {
    try {
        const res = await fetch('https://genius.com/Lazza-cenere-lyrics');
        const html = await res.text();
        
        let lyrics = '';
        let parts = html.split('data-lyrics-container="true"');
        for (let i = 1; i < parts.length; i++) {
            let chunk = parts[i];
            
            let openDivs = 1;
            let j = chunk.indexOf('>') + 1;
            
            while (openDivs > 0 && j < chunk.length) {
                let nextOpen = chunk.indexOf('<div', j);
                let nextClose = chunk.indexOf('</div', j);
                
                if (nextClose === -1) break;
                
                if (nextOpen !== -1 && nextOpen < nextClose) {
                    openDivs++;
                    j = nextOpen + 4;
                } else {
                    openDivs--;
                    j = nextClose + 6;
                }
            }
            
            let containerHtml = chunk.substring(chunk.indexOf('>') + 1, j - 6); // end before </div>
            
            let text = containerHtml
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&#x27;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/\u200B/g, '')
                .trim();
                
            lyrics += text + '\n\n';
        }
        
        // Pulisce intestazione
        lyrics = lyrics.replace(/.*Contributors.*?Lyrics\s*\n*/i, '');
        // Rimuove i tag di sistema [Chorus], [Strofa], [Ad]
        lyrics = lyrics.replace(/\[.*?\]/g, '');
        // Rimuove le righe vuote in eccesso (più di 2)
        lyrics = lyrics.replace(/\n{3,}/g, '\n\n');
        
        console.log(lyrics.trim());
    } catch (e) {
        console.error(e);
    }
})();
