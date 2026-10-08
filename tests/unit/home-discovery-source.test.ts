import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('home country pills and discovery banners are real actionable controls',async()=>{
 const home=await readFile('src/components/screens/HomeScreen.tsx','utf8');
 const app=await readFile('src/context/AppContext.tsx','utf8');
 assert.match(home,/discoverHomeRooms\(rooms,selectedFilter\)/);
 assert.match(home,/displayedRooms\.slice\(0, 8\)/);
 assert.doesNotMatch(home,/rooms\.slice\(0, 4\)/,'avoid a fabricated/partial 4-room preview with non-working filter');
 assert.match(home,/HOME_COUNTRIES\.map/);
 assert.match(home,/setSelectedFilter\(country\.id\)/);
 assert.doesNotMatch(home,/country\.id as any/);
 assert.match(home,/كل الغرف ←/);
 assert.match(app,/\.select\('id,country_code'\)\.in\('id',ownerIds\)/);
 assert.match(app,/countryFlag:flagFromCountryCode\(countryByOwner\.get/);
 assert.ok((home.match(/<button type="button" aria-label="(?:المعرف المميز - Toti Chat|هدية مخصصة|النجم العالمي|نشاط إعادة الشحن|رفقاء الروح الأسبوعية|افتتاح الوكالة جديده)"/g)||[]).length===6);
});
