async function test() {
  const r = await fetch('https://open.spotify.com/artist/238y1dKPtMeFEpX3Y6H1Vr');
  const t = await r.text();
  const match = t.match(/<meta property="og:image" content="(.*?)"/);
  console.log(match ? match[1] : 'Not found');
}
test();
