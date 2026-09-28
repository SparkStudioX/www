'use strict';

// Site appearance is local to the visitor’s browser.
const themeKey = 'sparkstudio.site.theme.v1';
const themePicker = document.getElementById('theme-picker');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
function readTheme() {
  try { const saved = localStorage.getItem(themeKey); return ['light', 'dark', 'system'].includes(saved) ? saved : 'light'; }
  catch { return 'light'; }
}
let themePreference = readTheme();
function applyTheme() {
  const theme = themePreference === 'system' ? (systemTheme.matches ? 'dark' : 'light') : themePreference;
  document.documentElement.dataset.theme = theme;
  themePicker.value = themePreference;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#111722' : '#f7f8fc';
}
themePicker.addEventListener('change', () => {
  themePreference = themePicker.value;
  try { localStorage.setItem(themeKey, themePreference); } catch { /* The preference still works for this visit. */ }
  applyTheme();
});
systemTheme.addEventListener('change', () => { if (themePreference === 'system') applyTheme(); });
window.addEventListener('storage', event => { if (event.key === themeKey || event.key === null) { themePreference = readTheme(); applyTheme(); } });
applyTheme();

document.getElementById('year').textContent = new Date().getFullYear();
