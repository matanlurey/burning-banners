import { spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync } from 'node:fs';
const run = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], {stdio:'inherit'});
if (run.status) process.exit(run.status);
mkdirSync('dist', {recursive:true});
for (const file of ['index.html','style.css','content-editor.html']) copyFileSync('src/'+file, 'dist/'+file);
console.log('Built browser-local Burning Banners war table.');
