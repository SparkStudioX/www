'use strict';

// The illustration is intentionally local. It never connects to a gateway.
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

const cells = {
  Cell04: { rate: 142, target: 150, progress: 68 },
  Cell07: { rate: 116, target: 125, progress: 42 },
};
const cellSelect = document.getElementById('cell-select');
const announcement = document.getElementById('demo-announcement');
const dialog = document.getElementById('settings-dialog');
const targetInput = document.getElementById('target-input');
const settingsButton = document.getElementById('settings-button');
let popupCell = 'Cell04';
function updateCell() {
  const key = cellSelect.value;
  const values = cells[key];
  document.getElementById('cell-code').textContent = key.replace('Cell', 'CELL ');
  document.getElementById('rate-value').textContent = values.rate;
  document.getElementById('target-value').textContent = values.target;
  document.getElementById('progress-value').replaceChildren(document.createTextNode(String(values.progress)), Object.assign(document.createElement('span'), { textContent: '%' }));
  document.getElementById('progress-bar').style.width = `${values.progress}%`;
  document.getElementById('tag-rate').textContent = values.rate;
  document.getElementById('tag-target').textContent = values.target;
  document.querySelector('.explorer-tags>div:not(.panel-caption)').lastChild.textContent = ` Cells / ${key}`;
  document.getElementById('resolved-path').textContent = `[default]Cells/${key}/Rate`;
}
cellSelect.addEventListener('change', () => {
  updateCell();
  announcement.textContent = `Showing sample values for ${cellSelect.value}. Current rate ${cells[cellSelect.value].rate} units per minute.`;
});
document.querySelectorAll('[data-mode]').forEach(button => {
  button.addEventListener('click', () => {
    const preview = button.dataset.mode === 'preview';
    document.getElementById('product-demo').classList.toggle('preview-mode', preview);
    document.querySelectorAll('[data-mode]').forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    document.getElementById('mode-description').textContent = preview ? 'The operator view. Your application.' : 'Place. Resize. Connect.';
    document.getElementById('demo-status-text').textContent = preview ? 'Try Cell settings to open a sample form' : 'Try the cell selector or switch to Preview';
    announcement.textContent = preview ? 'Preview illustration. Designer panels hidden.' : 'Designer illustration. Project and property panels visible.';
  });
});
settingsButton.addEventListener('click', () => {
  popupCell = cellSelect.value;
  document.getElementById('settings-title').textContent = `${popupCell} settings`;
  targetInput.value = cells[popupCell].target;
  dialog.showModal();
  targetInput.focus();
});
function closeSettings() { dialog.close(); settingsButton.focus({ preventScroll: true }); }
document.getElementById('dialog-close').addEventListener('click', closeSettings);
document.getElementById('dialog-cancel').addEventListener('click', closeSettings);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeSettings(); });
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey) return;
  const controls = [...dialog.querySelectorAll('button,input')].filter(control => !control.disabled && control.getClientRects().length);
  const index = controls.indexOf(document.activeElement);
  if (index < 0 || (event.shiftKey ? index === 0 : index === controls.length - 1)) {
    event.preventDefault(); controls[event.shiftKey ? controls.length - 1 : 0].focus();
  }
});
document.getElementById('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const value = Number(targetInput.value);
  if (!Number.isFinite(value) || value < 1 || value > 300) return;
  cells[popupCell].target = value;
  updateCell();
  closeSettings();
  document.getElementById('demo-status-text').textContent = `${popupCell} sample target updated to ${value}`;
  announcement.textContent = `${popupCell} sample target updated to ${value} units per minute. No equipment is connected.`;
});
document.getElementById('year').textContent = new Date().getFullYear();
updateCell();
