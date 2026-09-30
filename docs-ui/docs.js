'use strict';
const sidebar = document.getElementById('docs-sidebar');
const menu = document.getElementById('docs-menu');
const shade = document.querySelector('.drawer-shade');
const mobile = matchMedia('(max-width: 760px)');
function setDrawer(open) {
  document.body.classList.toggle('drawer-open', open);
  menu.setAttribute('aria-expanded', String(open)); shade.hidden = !open;
  if (open) { sidebar.setAttribute('role', 'dialog'); sidebar.setAttribute('aria-modal', 'true'); document.getElementById('docs-search').focus(); }
  else { sidebar.removeAttribute('role'); sidebar.removeAttribute('aria-modal'); }
}
function closeDrawer() { setDrawer(false); menu.focus(); }
menu.addEventListener('click', () => setDrawer(!document.body.classList.contains('drawer-open')));
document.getElementById('docs-close').addEventListener('click', closeDrawer);
shade.addEventListener('click', closeDrawer);
mobile.addEventListener('change', () => setDrawer(false));
document.addEventListener('keydown', event => {
  if (!document.body.classList.contains('drawer-open')) return;
  if (event.key === 'Escape') closeDrawer();
  if (event.key === 'Tab') {
    const elements = [...sidebar.querySelectorAll('a,button,input')].filter(el => el.getClientRects().length);
    const first = elements[0], last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
document.querySelectorAll('.markdown :is(h1,h2,h3,h4,h5,h6)[id]').forEach(heading => {
  const anchor = document.createElement('a'); anchor.className = 'heading-anchor'; anchor.href = '#' + heading.id; anchor.textContent = '#'; anchor.setAttribute('aria-label', `Link to ${heading.textContent}`); heading.append(anchor);
});
document.querySelectorAll('.markdown table').forEach(table => {
  const wrapper = document.createElement('div'); wrapper.className = 'table-scroll'; wrapper.tabIndex = 0; wrapper.setAttribute('role', 'region'); wrapper.setAttribute('aria-label', 'Scrollable documentation table'); table.replaceWith(wrapper); wrapper.append(table);
});
document.querySelectorAll('.markdown pre').forEach(pre => {
  const button = document.createElement('button'); button.className = 'copy-code'; button.textContent = 'Copy'; button.setAttribute('aria-label', 'Copy code');
  button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(pre.querySelector('code').textContent); button.textContent = 'Copied'; }
    catch { button.textContent = 'Select and copy'; const selection = getSelection(); const range = document.createRange(); range.selectNodeContents(pre.querySelector('code')); selection.removeAllRanges(); selection.addRange(range); }
    setTimeout(() => { button.textContent = 'Copy'; }, 2000);
  }); pre.append(button);
});
const input = document.getElementById('docs-search'), results = document.getElementById('search-results'), status = document.getElementById('search-status'), nav = document.getElementById('docs-nav');
let searchPromise;
input.addEventListener('input', async () => {
  const query = input.value.trim().toLowerCase();
  results.replaceChildren(); results.hidden = !query; nav.hidden = !!query; status.textContent = query ? 'Searching…' : '';
  if (!query) return;
  try {
    searchPromise ||= fetch('/docs-assets/search.json').then(response => { if (!response.ok) throw new Error('Search unavailable'); return response.json(); }).catch(error => { searchPromise = null; throw error; });
    const pages = await searchPromise; if (query !== input.value.trim().toLowerCase()) return;
    const terms = query.split(/\s+/);
    const hits = pages.map(page => ({ ...page, score: terms.reduce((score, term) => score + (page.title.toLowerCase().includes(term) ? 10 : 0), 0) })).filter(page => terms.every(term => (page.title + ' ' + page.text).toLowerCase().includes(term))).sort((a, b) => b.score - a.score);
    status.textContent = hits.length ? `${hits.length} matching ${hits.length === 1 ? 'page' : 'pages'}` : 'No matching pages. Try another term.';
    hits.forEach(page => {
      const item = document.createElement('li'), link = document.createElement('a'), detail = document.createElement('small'); link.href = page.url; link.textContent = page.title;
      const position = Math.max(0, page.text.toLowerCase().indexOf(terms[0]) - 30); detail.textContent = (position ? '…' : '') + page.text.slice(position, position + 120) + '…'; link.append(detail); item.append(link); results.append(item);
    });
  } catch { if (query !== input.value.trim().toLowerCase()) return; status.textContent = 'Search is unavailable. Browse topics below.'; nav.hidden = false; }
});
// Keep long navigation lists positioned near the selected guide on desktop.
if (!mobile.matches) { const active = sidebar.querySelector('[aria-current="page"]'); if (active && active.offsetTop > sidebar.clientHeight * .7) sidebar.scrollTop = active.offsetTop - 180; }
