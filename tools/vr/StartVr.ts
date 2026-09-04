import path from 'path';

const engineRoot = path.resolve(import.meta.dir, '../..');
process.chdir(engineRoot);

process.env.VR_SINGLEPLAYER = 'true';
process.env.VR_BIND ??= '127.0.0.1';
process.env.NODE_MAX_CONNECTED ??= '1';
process.env.WEBSITE_REGISTRATION ??= 'false';
process.env.LOGIN_SERVER ??= 'false';

await import('../../src/app.ts');
