import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import path from 'node:path';

export const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const route = file => file === 'README.md' ? '/docs/' : `/docs/${file.replace(/\.md$/, '').toLowerCase().replaceAll('_', '-')}/`;
export function parseDocs(files, readSource, config) {
  const md = new MarkdownIt({ html: false, linkify: false, highlight(code, lang) {
    return lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value : '';
  }});
  const docs = new Map();
  for (const [file, source] of files) {
    const tokens = md.parse(source, {}), headings = [], counts = new Map();
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'heading_open') continue;
      const title = tokens[i + 1].children.filter(t => ['text', 'code_inline'].includes(t.type)).map(t => t.content).join('');
      const base = title.toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, '').replace(/\s/g, '-');
      const count = counts.get(base) || 0; counts.set(base, count + 1);
      const id = base + (count ? `-${count}` : '');
      tokens[i].attrSet('id', id);
      headings.push({ title, id, level: Number(tokens[i].tag.slice(1)) });
    }
    if (!headings.some(h => h.level === 1)) throw new Error(`Missing page title: ${file}`);
    docs.set(file, { file, source, tokens, headings, title: headings.find(h => h.level === 1).title, url: route(file) });
  }
  const groups = []; let group;
  const index = docs.get('README.md');
  if (!index) throw new Error('Missing documentation README.md');
  for (const line of index.source.split(/\r?\n/)) {
    const heading = /^## (.+)/.exec(line);
    if (heading) { group = { title: heading[1], items: [] }; groups.push(group); }
    const item = /^- \[([^\]]+)\]\(([A-Z0-9_]+\.md)\)/.exec(line);
    if (!item) continue;
    if (!group || !docs.has(item[2])) throw new Error(`Invalid navigation entry: ${line}`);
    group.items.push({ title: item[1], file: item[2], url: route(item[2]) });
  }
  const ordered = [{ title: 'Documentation overview', file: 'README.md', url: '/docs/' }, ...groups.flatMap(g => g.items)];
  if (new Set(ordered.map(i => i.file)).size !== ordered.length || ordered.length !== docs.size) throw new Error('Every document must appear exactly once in the navigation');
  const missing = new Set();
  for (const doc of docs.values()) {
    const walk = tokens => {
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.children) walk(token.children);
        if (!['link_open', 'image'].includes(token.type)) continue;
        const attr = token.type === 'image' ? 'src' : 'href', href = token.attrGet(attr);
        if (/^(?:https?:|mailto:)/i.test(href)) continue;
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) throw new Error(`Unsupported URL in ${doc.file}: ${href}`);
        const [pathname, hash] = href.split('#');
        const relative = path.posix.normalize(path.posix.join('docs/architecture', decodeURIComponent(pathname || doc.file)));
        if (relative.startsWith('../') || path.posix.isAbsolute(relative)) throw new Error(`Link escapes source: ${href}`);
        const target = docs.get(relative.replace(/^docs\/architecture\//, ''));
        if (target && relative.startsWith('docs/architecture/')) {
          if (hash && !target.headings.some(h => h.id === decodeURIComponent(hash))) throw new Error(`Missing anchor in ${doc.file}: ${href}`);
          token.attrSet(attr, target.url + (hash ? '#' + hash : ''));
        } else if (readSource(relative) === null) {
          if (!config.unpublishedSources?.includes(relative) || token.type === 'image') throw new Error(`Missing source link in ${doc.file}: ${href}`);
          // Deliberately do not emit a broken GitHub link to work not yet committed.
          token.type = 'html_inline'; token.content = '<span class="pending-source" title="Example source is part of ongoing development and is not published in this revision.">';
          let depth = 1, end = i + 1;
          for (; end < tokens.length; end++) { if (tokens[end].type === 'link_open') depth++; if (tokens[end].type === 'link_close' && --depth === 0) break; }
          if (end === tokens.length) throw new Error('Unbalanced link');
          tokens[end].type = 'html_inline'; tokens[end].content = ' <small>(source pending publication)</small></span>';
          missing.add(relative);
        } else {
          token.attrSet(attr, `https://github.com/${config.repository}/blob/${config.ref}/${relative.split('/').map(encodeURIComponent).join('/')}${hash ? '#' + hash : ''}`);
        }
      }
    };
    walk(doc.tokens);
    doc.html = md.renderer.render(doc.tokens, md.options, {});
  }
  for (const file of config.unpublishedSources || []) if (!missing.has(file)) throw new Error(`Remove obsolete unpublished source exception: ${file}`);
  return { docs, groups: groups.filter(g => g.items.length), ordered };
}
