const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

async function main() {
  const titles = ['기생충', '범죄도시 4', '듄: 파트 2'];

  for (const t of titles) {
    const u = new URL('/api/movie', BASE);
    u.searchParams.set('query', t);
    const res = await fetch(u.toString());
    const body = await res.json().catch(() => null);
    console.log(`\n== ${t} ==`);
    console.log(`status=${res.status}`);
    console.log(JSON.stringify(body, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

