import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['.env.local', '.env']) if (existsSync(path.join(app, name))) loadEnvFile(path.join(app, name));
const build = process.env.YOH_BUILD_DIR || '.next';
const base = path.join(app, build, 'standalone');
const server = existsSync(path.join(base, 'yoh-app-academy', 'server.js')) ? path.join(base, 'yoh-app-academy', 'server.js') : path.join(base, 'server.js');
if (!existsSync(server)) throw new Error('Run pnpm build before pnpm start.');
const args = process.argv.slice(2); const option = name => args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : undefined;
const child = spawn(process.execPath, [server], { stdio: 'inherit', env: {
  ...process.env,
  PORT: option('--port') || process.env.PORT || '3002',
  HOSTNAME: option('--hostname') || process.env.HOSTNAME || '0.0.0.0',
  YOH_DATA_DIR: path.resolve(app, process.env.YOH_DATA_DIR || '.data'),
} });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exit(1); });
child.on('exit', code => process.exit(code ?? 0));
