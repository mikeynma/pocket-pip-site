// pocketpipgames.com (npm run site): the game of the day, Pip's fact of the day, and the bigger-screenshot dialog.

// the same for everyone all day, changing at midnight (the visitor's own midnight)
const now = new Date(), day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5);
const featured = document.querySelectorAll('.featured');
if (featured.length) {
  featured.forEach((f, i) => { f.hidden = i !== day % featured.length });
  document.querySelector('.today .date').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
const facts = document.getElementById('facts');
if (facts) { const list = JSON.parse(facts.textContent); document.querySelector('.pip-says .fact').textContent = list[(day * 7) % list.length] }

// tap a screenshot to see it bigger; ◀ ▶, the arrow keys or a swipe step through that game's screenshots
const zoom = document.querySelector('.zoom'), zImg = zoom.querySelector('img'), zText = zoom.querySelector('p');
let group = [], at = 0;
const show = (i) => {
  at = (i + group.length) % group.length; const img = group[at].querySelector('img');
  zImg.src = img.src; zImg.alt = img.alt; zText.textContent = `${img.alt} (${at + 1} of ${group.length})`;
};
document.querySelectorAll('.shots a').forEach((a) => a.addEventListener('click', (ev) => {
  ev.preventDefault(); group = [...a.closest('.shots').querySelectorAll('a')]; show(group.indexOf(a)); zoom.showModal();
}));
zoom.querySelector('.x').onclick = () => zoom.close();
zoom.querySelector('.prev').onclick = () => show(at - 1);
zoom.querySelector('.next').onclick = () => show(at + 1);
zoom.addEventListener('click', (ev) => { if (ev.target === zoom) zoom.close() }); // a tap outside the picture
zoom.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowLeft') show(at - 1); if (ev.key === 'ArrowRight') show(at + 1) });
let x0 = null;
zImg.addEventListener('pointerdown', (ev) => { x0 = ev.clientX });
zImg.addEventListener('pointerup', (ev) => { if (x0 !== null && Math.abs(ev.clientX - x0) > 40) show(at + (ev.clientX < x0 ? 1 : -1)); x0 = null });

// Pip's words under the homepage strip, in step with its CSS animation
const strip = document.querySelector('.pip-anim'), saysEl = document.querySelector('.strip .says');
if (strip && saysEl) {
  const lines = JSON.parse(document.getElementById('says').textContent), n = +getComputedStyle(strip.parentNode).getPropertyValue('--n'),
    ms = parseFloat(getComputedStyle(strip.parentNode).getPropertyValue('--ms'));
  const tick = () => {
    const a = strip.getAnimations()[0]; if (a) { const f = Math.floor(a.currentTime / ms) % n; let t = ''; for (const [i, w] of lines) { if (i > f) break; t = w } if (saysEl.textContent !== t) saysEl.textContent = t }
    requestAnimationFrame(tick);
  };
  tick();
}

// the secret: type "pip", or tap the logo Pip five times quickly, and he celebrates (not while "reduce motion" is on)
const logoPip = document.querySelector('.logo .pip-o');
if (logoPip && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const party = () => { if (logoPip.classList.contains('party')) return; logoPip.classList.add('party'); setTimeout(() => logoPip.classList.remove('party'), 2400) };
  let typed = '', taps = [];
  addEventListener('keydown', (ev) => { if (ev.target.closest && ev.target.closest('input')) return; typed = (typed + ev.key.toLowerCase()).slice(-3); if (typed === 'pip') party() });
  logoPip.addEventListener('pointerdown', () => { const t = Date.now(); taps = taps.filter((x) => t - x < 1500).concat(t); if (taps.length >= 5) { taps = []; party() } });
}

// Ctrl+K (or the Search button): find any page or help question
const finder = document.querySelector('.finder'), findQ = document.getElementById('find-q'), findList = document.getElementById('find-list');
let findIndex = null, findHits = [], findAt = 0;
const FIND_PIX = {
  help: ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  privacy: ['.###.', '#...#', '#...#', '#####', '##.##', '##.##', '#####'],
  page: ['####.', '#..##', '#...#', '#.###', '#...#', '#.###', '#####'],
};
const findIcon = (e) => {
  const box = document.createElement('span'); box.className = 'fi'; box.setAttribute('aria-hidden', 'true');
  if (e.i) { const img = document.createElement('img'); img.src = e.i; img.alt = ''; box.append(img); return box }
  const rows = FIND_PIX[e.g === 'Privacy' ? 'privacy' : e.g === 'Page' ? 'page' : 'help'];
  box.innerHTML = `<svg viewBox="0 0 5 7" shape-rendering="crispEdges">${rows.map((r, y) => [...r].map((c, x) => c === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : '').join('')).join('')}</svg>`;
  return box;
};
const FIND_RANK = { Game: 1.5, Page: 1, Help: .5, Privacy: .5 }; // on a tie, games first, then pages, then help and privacy pages, then questions
const FIND_SKIP = new Set('a an and the my me i is it to do does how what why can of in on for with when where who there his he'.split(' '));
const findRender = () => {
  const words = findQ.value.toLowerCase().split(/[^a-z0-9é']+/).filter((w) => w.length > 1 && !FIND_SKIP.has(w));
  // with nothing typed: the games, then the other pages; typed: ranked by how many words match (a word in the title counts double)
  findHits = !words.length ? (findIndex || []).filter((e) => e.g === 'Game').concat((findIndex || []).filter((e) => e.g === 'Page')).slice(0, 8)
    : (findIndex || []).map((e) => { const t = e.t.toLowerCase(), all = (e.t + ' ' + e.g + ' ' + (e.k || '')).toLowerCase(); let n = 0;
        for (const w of words) { const stem = w.length > 4 && !/ss$/.test(w) ? w.replace(/(ing|ed|es|s)$/, '') : w; if (t === w) n += 5; else if (t.includes(stem)) n += 2; else if (all.includes(stem)) n += 1 }
        return [n && n + (FIND_RANK[e.g] || 0), e] }).filter(([n]) => n > 0).sort((x, y) => y[0] - x[0]).slice(0, 8).map(([, e]) => e);
  findAt = Math.min(findAt, Math.max(0, findHits.length - 1));
  findList.replaceChildren(...(findHits.length ? findHits.map((e, i) => {
    const li = document.createElement('li'), b = document.createElement('b'), sp = document.createElement('span');
    li.id = 'find-' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === findAt); b.textContent = e.t; sp.textContent = e.g;
    li.append(findIcon(e), b, sp); li.onclick = () => { location.href = e.u }; return li;
  }) : [Object.assign(document.createElement('li'), { className: 'none', textContent: findIndex ? 'Nothing found. Try another word!' : 'Loading...' })]));
  if (findHits.length) findQ.setAttribute('aria-activedescendant', 'find-' + findAt); else findQ.removeAttribute('aria-activedescendant');
};
const findOpen = () => {
  if (finder.open) return; finder.showModal(); findQ.value = ''; findAt = 0; findRender(); findQ.focus();
  if (!findIndex) fetch('/search.json').then((r) => r.json()).then((d) => { findIndex = d; findRender() });
};
document.querySelector('.find-btn').addEventListener('click', findOpen);
addEventListener('keydown', (ev) => { if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); findOpen() } });
findQ.addEventListener('input', () => { findAt = 0; findRender() });
findQ.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') { ev.preventDefault(); finder.close(); return }
  if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); findAt = (findAt + (ev.key === 'ArrowDown' ? 1 : -1) + findHits.length) % Math.max(1, findHits.length); findRender() }
  if (ev.key === 'Enter' && findHits[findAt]) { ev.preventDefault(); location.href = findHits[findAt].u }
});
finder.addEventListener('click', (ev) => { if (ev.target === finder) finder.close() });

// a help question's address (help.html#q7) opens that answer
const openAsked = () => { const d = location.hash && document.getElementById(location.hash.slice(1)); if (d && d.tagName === 'DETAILS') { d.hidden = false; d.open = true; d.scrollIntoView({ block: 'center' }) } };
openAsked(); addEventListener('hashchange', openAsked);
