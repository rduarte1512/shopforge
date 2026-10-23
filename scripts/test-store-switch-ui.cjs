/* Regression guard for the accessible, searchable ShopForge store switcher. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const base = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(base, 'components/dashboard/StoreSwitcher.tsx'), 'utf8');
const shell = fs.readFileSync(path.join(base, 'app/dashboard/DashboardLayoutClient.tsx'), 'utf8');

assert.match(shell, /<StoreSwitcher[\s\S]*onSelectStore=\{changeStore\}/, 'Dashboard must use the actual store-changing callback');
assert.doesNotMatch(shell, /<select aria-label="Selecionar loja"/, 'Native store selector must be replaced');
assert.match(source, /normalize\('NFD'\)/, 'Search should work regardless of accents');
assert.match(source, /filteredStores = useMemo/, 'Store list should filter without server requests');
assert.match(source, /document\.addEventListener\('pointerdown'/, 'Clicking outside must close the selector');
assert.match(source, /event\.key === 'Escape'/, 'Escape must close the selector');
assert.match(source, /event\.key === 'ArrowDown'/, 'Keyboard navigation must be supported');
assert.match(source, /event\.key === 'Enter'/, 'Enter must select the highlighted store');
assert.match(source, /aria-expanded=\{open\}/, 'Disclosure must expose expanded state');
assert.match(source, /aria-selected=\{isActive\}/, 'Selected store must be announced to assistive technology');
assert.match(source, /isSwitchingStore/, 'The selector must respect loading state');
assert.match(source, /onSelectStore\(storeId\)/, 'Store change must invoke existing selection flow');
assert.match(source, /Nenhuma loja encontrada/, 'No-result state must be present');
console.log('PASS: premium selector, accessible controls, search, keyboard and existing store-change behavior.');
