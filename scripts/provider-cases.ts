import { buildRegionProviders } from '../src/lib/provider-transform';
import type { TmdbCountryProviders } from '../src/lib/tmdb';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

function keys(arr: Array<{ key: string }>) {
  return arr.map((x) => x.key);
}

function case1() {
  // 1) KR에 flatrate 존재 -> paid 숨김
  const kr: TmdbCountryProviders = {
    link: 'https://www.justwatch.com/kr',
    flatrate: [
      { provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priority: 1 },
      { provider_id: 337, provider_name: 'Disney Plus', logo_path: null, display_priority: 2 },
    ],
    rent: [{ provider_id: 2, provider_name: 'Apple TV Plus', logo_path: null, display_priority: 10 }],
    buy: [{ provider_id: 2, provider_name: 'Apple TV Plus', logo_path: null, display_priority: 10 }],
  };

  const region = buildRegionProviders('KR', kr);
  assert(region.exists === true, 'case1: exists');
  assert(region.primaryProviders.length === 2, 'case1: primaryProviders length');
  assert(region.showPaid === false, 'case1: showPaid must be false');
  assert(region.paidProviders.rent.length === 1, 'case1: paid rent still computed (server decides to hide via showPaid)');
  assert(keys(region.primaryProviders).join(',') === 'netflix,disney', 'case1: sort order');
}

function case2() {
  // 2) KR에 flatrate 없음, rent/buy만 존재 -> paid만 표시
  const kr: TmdbCountryProviders = {
    link: 'https://www.justwatch.com/kr',
    rent: [
      { provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priority: 1 }, // filtered in whitelist
      { provider_id: 2, provider_name: 'Apple TV Plus', logo_path: null, display_priority: 10 },
    ],
    buy: [{ provider_id: 2, provider_name: 'Apple TV Plus', logo_path: null, display_priority: 10 }],
  };

  const region = buildRegionProviders('KR', kr);
  assert(region.primaryProviders.length === 0, 'case2: primaryProviders empty');
  assert(region.showPaid === true, 'case2: showPaid true');
  assert(keys(region.paidProviders.rent).join(',') === 'netflix,appletvplus', 'case2: paid rent order');
  assert(keys(region.paidProviders.buy).join(',') === 'appletvplus', 'case2: paid buy order');
}

function case3() {
  // 3) KR 자체 없음 -> KR 없음 메시지 + fallback(선택)
  const krMissing = undefined;
  const us: TmdbCountryProviders = {
    link: 'https://www.justwatch.com/us',
    flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: null, display_priority: 1 }],
  };

  const kr = buildRegionProviders('KR', krMissing);
  const fallback = buildRegionProviders('US', us);

  assert(kr.exists === false, 'case3: kr.exists false');
  assert(Boolean(kr.message), 'case3: kr.message exists');
  assert(fallback.exists === true, 'case3: fallback exists');
  assert(fallback.primaryProviders.length === 1, 'case3: fallback primary has 1');
}

function main() {
  case1();
  case2();
  case3();
  console.log('provider-cases: PASS');
}

main();

