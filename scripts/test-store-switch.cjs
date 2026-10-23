// Regression guard: the sidebar must synchronize the selected shop with the
// server and every server-rendered page must fetch that shop, not stores[0].
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const shell=read('app/dashboard/DashboardLayoutClient.tsx');
const layout=read('app/dashboard/layout.tsx');
assert.match(layout,/getSelectedStoreId\(\)/,'Server layout must read selection cookie');
assert.match(layout,/initialSelectedStoreId=\{activeStoreId\}/,'Server layout must pass active shop into client shell');
assert.match(shell,/await setSelectedStoreCookie\(storeId\)[\s\S]*router\.refresh\(\)/,'The selected cookie must be saved before Next.js refresh');
assert.match(shell,/key=\{initialSelectedStoreId \|\| 'no-store'\}/,'The RSC children must remount for each new shop');
assert.match(shell,/useMockDB\.getState\(\)\.setSelectedStore\(activeId\)/,'Legacy Zustand screens must receive selected shop');
assert.match(shell,/isSwitchingStore/, 'The switcher must provide loading feedback');
for(const name of ['products','orders','customers','affiliates','coupons','promotions','shipping']){
 const page=read('app/dashboard/'+name+'/page.tsx');
 assert.match(page,/getSelectedStoreId\(\)/,name+' must read selected cookie');
 assert.match(page,/stores\.find\([^)]*store\.id === selectedStoreId|stores\.find\([^)]*store\.id === cookieStoreId/,name+' must validate selected shop membership');
 assert.doesNotMatch(page,/selectedStoreId = stores\[0\]\.id/,name+' must not force the first shop');
}
console.log('PASS: selected-shop cookie, safe client remount, and all store-scoped server pages.');
