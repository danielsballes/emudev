// GitHub Pages serves 404.html for unknown paths; copying index.html lets
// Vue Router resolve deep links in history mode.
import { copyFile } from 'node:fs/promises';

await copyFile('dist/index.html', 'dist/404.html');
