/* Active writer-home acceptance after Civita migration.
 * The writer character, furnished room and publisher/story data must remain intact.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'.');
const read=p=>readFileSync(resolve(root,p),'utf8');
const world=read('web/world.js'),shell=read('web/civita-writer-house.js');
for(const contract of [
 'writerInteriorWorldRoot.add(baseWriterRoomShell);',
 'writerInteriorWorldRoot.add(expandedWriterRoomShell);',
 'for (const node of interiorSceneObjects) writerInteriorWorldRoot.add(node);',
 'writerInteriorWorldRoot.position.y = STREET_Y + 3.2;',
 'writerExterior.position.y = 3.2;',
 'buildCivitaWriterExterior(THREE,writerExterior,',
 'rebuildWriterInteriorShell(level=0)',
 'if(o.userData.writerExterior){setView("building");return;}',
 'camGoal.pos.applyMatrix4(writerInteriorWorldRoot.matrixWorld);',
 'camGoal.target.applyMatrix4(writerInteriorWorldRoot.matrixWorld);',
 'loadCivitaWriterParcel()',
 'town.setWriterPlacement(site)',
 'writerExterior.visible=outdoors && Boolean(writerParcelSite);'
])assert.ok(world.includes(contract),'Writer room/home safety contract missing: '+contract);
assert.ok(!world.includes('const apartment=buildWriterApartmentLowerStoreys(THREE,writerExterior'),'Retired Tehran apartment still used');
assert.ok(shell.includes("storyCountReference:2")&&shell.includes('matchedToActualLoStudio:false'),'Unverified Lo Studio status required');
assert.ok(shell.includes('protectedWriterAppearance:true'),'Writer appearance must remain unchanged');
assert.ok(world.includes('let view = "town"'),'Main default city should remain an outdoor view');
console.log('CIVITA-WRITER-HOME-CONSISTENCY-OK',{storyCount:2,interiorPreserved:true,writerAppearancePreserved:true});
