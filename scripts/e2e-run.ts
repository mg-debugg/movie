import http from 'node:http';

import next from 'next';

async function main() {
  // Production-mode server (requires `npm run build` first). Much more stable for automation.
  const app = next({ dev: false, dir: process.cwd(), hostname: '127.0.0.1', port: 0 });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = http.createServer((req, res) => {
    void handle(req, res);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('Failed to bind server');

  const base = `http://127.0.0.1:${addr.port}`;

  const home = await fetch(`${base}/`);
  console.log(`[home] status=${home.status}`);

  const titles = ['기생충', '범죄도시 4', '듄: 파트 2'];
  for (const t of titles) {
    const u = new URL('/api/movie', base);
    u.searchParams.set('query', t);
    const res = await fetch(u.toString());
    const body = await res.json().catch(() => null);
    console.log(`\n[api/movie] ${t} status=${res.status}`);
    console.log(JSON.stringify(body, null, 2));
  }

  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
