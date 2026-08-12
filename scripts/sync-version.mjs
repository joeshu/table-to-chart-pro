import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const configUrl = new URL('../src-tauri/tauri.conf.json', import.meta.url);
const config = JSON.parse(fs.readFileSync(configUrl, 'utf8'));
if (config.version !== pkg.version) {
  config.version = pkg.version;
  fs.writeFileSync(configUrl, `${JSON.stringify(config, null, 2)}\n`);
}
console.log(`Synced application version ${pkg.version}`);
