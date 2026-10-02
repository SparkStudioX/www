import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDocs } from './docs.mjs';
const config = { repository: 'SparkStudioX/src', ref: 'a'.repeat(40) };
const index = '# Docs\n\n## Group\n\n- [Guide](GUIDE.md)';
function build(guide, extra = {}) { return parseDocs(new Map([['README.md', index], ['GUIDE.md', guide]]), file => file === 'examples/demo.json' ? '{}' : null, { ...config, ...extra }); }
test('pretty routes, anchors, tables, code highlighting, pinned source and escaped HTML', () => {
  const { docs, ordered } = build('# Guide\n\n[Home](README.md) [Source](../../examples/demo.json) [Heading](#same-1)\n\n## Same\n\n## Same\n\n<script>alert(1)</script>\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n```json\n{"ok":true}\n```');
  const html = docs.get('GUIDE.md').html;
  assert.match(html, /href="\/docs\/"/); assert.match(html, /id="same-1"/); assert.match(html, /<table>/); assert.match(html, /hljs-/); assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>/);
  assert.ok(html.includes(`/blob/${config.ref}/examples/demo.json`)); assert.equal(ordered.length, 2);
});
test('missing pages, missing anchors and traversal fail the build', () => {
  for (const link of ['MISSING.md', '#absent', '../../../../secret', '../../examples/missing.json']) assert.throws(() => build(`# Guide\n\n[Bad](${link})`), /Missing|escapes/);
});
test('unpublished development examples are explicit text rather than broken links', () => {
  const { docs } = build('# Guide\n\n[Draft](../../examples/pending.json)', { unpublishedSources: ['examples/pending.json'] });
  assert.match(docs.get('GUIDE.md').html, /source pending publication/); assert.doesNotMatch(docs.get('GUIDE.md').html, /href=/);
  assert.throws(() => build('# Guide', { unpublishedSources: ['examples/pending.json'] }), /obsolete/);
});
test('navigation must cover all pages exactly once', () => {
  assert.throws(() => parseDocs(new Map([['README.md', '# Docs'], ['GUIDE.md', '# Guide']]), () => null, config), /exactly once/);
});
test('protocol names containing digits participate in navigation and local links', () => {
  const { docs, groups, ordered } = parseDocs(new Map([
    ['README.md', '# Docs\n\n## Data source setup\n\n- [i3X setup walkthrough](I3X_SETUP.md)'],
    ['I3X_SETUP.md', '# i3X setup walkthrough\n\n[Overview](README.md)'],
  ]), () => null, config);
  assert.equal(groups[0].items[0].url, '/docs/i3x-setup/');
  assert.equal(ordered.length, 2);
  assert.match(docs.get('README.md').html, /href="\/docs\/i3x-setup\/"/);
});
test('unsafe Markdown links never become executable URLs', () => {
  const { docs } = build('# Guide\n\n[Click](javascript:alert%281%29)\n\n<img src=x onerror=alert(1)>');
  assert.doesNotMatch(docs.get('GUIDE.md').html, /href="javascript:|<img/);
});
