import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));
const v = pkg.version;
const sevenZip = resolve(__dirname, '../node_modules/7zip-bin/win/x64/7za.exe');
const outPath = resolve(__dirname, `../release/Desktop-Mascot-${v}-win-x64.zip`);
const inputDir = resolve(__dirname, '../release/win-unpacked');

console.log(`Creating Desktop-Mascot-${v}-win-x64.zip ...`);
execSync(`"${sevenZip}" a -tzip "${outPath}" .`, { cwd: inputDir, stdio: 'inherit' });
console.log(`Done: release/Desktop-Mascot-${v}-win-x64.zip`);
