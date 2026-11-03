import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = process.env.YOH_BUILD_DIR || '.next';
const base = path.join(app, build, 'standalone');
const target = existsSync(path.join(base, 'yoh-app-academy', 'server.js')) ? path.join(base, 'yoh-app-academy') : base;
if (!existsSync(path.join(target, 'server.js'))) throw new Error('Run the production build before packaging the server.');
mkdirSync(path.join(target, build), { recursive: true });
cpSync(path.join(app, 'public'), path.join(target, 'public'), { recursive: true });
cpSync(path.join(app, build, 'static'), path.join(target, build, 'static'), { recursive: true });
console.log('Production server, public assets and fonts packaged.');
