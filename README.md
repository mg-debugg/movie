# Movie OTT Finder (KR-first)

영화 제목을 입력하면 **한국(KR) 기준**으로 해당 영화가 어느 OTT에서 제공되는지 보여주는 Next.js MVP입니다.

데이터 소스는 **TMDB Watch Providers** API를 사용합니다.

## 목표 UX / 표시 규칙

- 기본 화면에는 “추가 결제 없이 볼 수 있는 제공처”만 최우선으로 보여줍니다.
  - TMDB `flatrate` + `free`를 합쳐서 1개의 리스트로 표시합니다.
  - UI 어디에도 `구독/Subscription/Flatrate` 같은 라벨 텍스트를 표시하지 않습니다.
- 대여/구매(TMDB `rent`/`buy`)는 **추가 결제 없이 볼 수 있는 제공처가 0개일 때만** 보조적으로 보여줍니다.
- 국가 우선:
  - TMDB 응답에 `results["KR"]`가 있으면 **KR만 사용**
  - `results["KR"]` 자체가 없으면 “KR 제공처 데이터 없음” 메시지 + (선택) `US` 대체 결과를 접어서 제공합니다.

## OTT 화이트리스트 & 정렬

서버에서 아래 제공처만 남기고, 우선순위대로 정렬합니다.

- 포함: Netflix, Disney+, TVING, Coupang Play, Wavve, Watcha, Apple TV+
- 정렬: Netflix > Disney+ > TVING > Coupang Play > Wavve > Watcha > Apple TV+
- 매칭: `provider_id`/`provider_name` 기반 (설정: `src/lib/provider-config.ts`)

## 기술 스택

- Front: Next.js (App Router) + TypeScript + Tailwind
- Back: Next.js Route Handlers (`/api/*`)로 프록시/캐시/레이트리밋

## 폴더 구조 (핵심 파일)

- `src/app/page.tsx` UI (자동완성 300ms, 스켈레톤, “추가 결제 없음” 우선 표시)
- `src/app/api/movie/route.ts` 검색 -> movieId -> watch/providers -> 표준 스키마로 가공
- `src/app/api/suggest/route.ts` 자동완성(상위 5개)
- `src/lib/provider-config.ts` 화이트리스트 + 정렬 + 매칭 테이블
- `src/lib/provider-transform.ts` TMDB 응답 -> 표준 스키마 변환
- `src/lib/tmdb.ts` TMDB API 클라이언트
- `src/lib/cache.ts` TTL 캐시(10분) + 고정 윈도우 레이트리밋(IP당 분당 30회)
- `src/lib/mock.ts` API 키 없을 때 동작하는 mock 응답
- `scripts/smoke-test.ts` API 스모크 테스트(3개 영화)
- `scripts/provider-cases.ts` 변환 로직 케이스 3개 검증

## 환경변수

`.env.local`에 넣고, **클라이언트에는 노출되지 않습니다.**

- `TMDB_API_KEY` (server only): TMDB API Key
- `USE_MOCK` (optional): `1`이면 mock 강제

예시: `.env.example`

## 로컬 실행

```bash
npm i
copy .env.example .env.local
npm run dev
```

브라우저: `http://localhost:3000`

## 테스트

1) API 스모크 테스트 (3개 영화)

```bash
npm run test:api
```

2) 제공처 표시 로직 케이스 테스트 (3 cases)

```bash
npm run test:providers
```

## GitHub 올리기

사용자 할 일:

1. GitHub에서 새 레포 생성 (public/private 아무거나)
2. 생성한 레포의 HTTPS URL 복사

터미널 명령 (프로젝트 루트에서):

```bash
git init
git add -A
git commit -m "feat: initial KR-first OTT MVP"
```

origin 설정 및 push (아래에서 `<REPO_URL>`만 붙여넣기):

```bash
# origin이 없으면 add, 있으면 set-url
git remote -v

# 처음 연결
git remote add origin <REPO_URL>

# 이미 origin이 있다면
git remote set-url origin <REPO_URL>

git branch -M main
git push -u origin main
```

## Vercel 배포 (자동 배포)

전제: 사용자가 Vercel 대시보드에서 “처음 1회 Import”만 수행.

1. Vercel Dashboard -> Add New -> Project -> GitHub Import
2. 이 레포 선택 후 Import
3. Framework: Next.js (자동 감지)
4. Build/Install 설정
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output: Next.js 기본값
5. Environment Variables
   - `TMDB_API_KEY` (server only)
   - `USE_MOCK` (optional)

이후부터는 `git push`만으로 자동 배포가 됩니다.

## 트러블슈팅

- 빌드 실패: 로컬에서 `npm run build` 먼저 확인. Node 버전이 너무 낮지 않은지 확인 (`package.json`의 `engines.node`)
- env 누락: Vercel에 `TMDB_API_KEY`가 없으면 API가 mock 또는 오류로 동작할 수 있음
- 키 노출 방지: `NEXT_PUBLIC_` 접두어로 키를 만들면 클라이언트로 노출됩니다. 절대 사용하지 마세요.
- 외부 API 호출: TMDB 호출은 반드시 `/api/*`(서버 Route Handler)에서만 수행해야 CORS/키 노출 문제가 없습니다.

## Notes / Tradeoffs

- 레이트리밋/캐시는 in-memory라서 Vercel 서버리스 환경에서는 인스턴스마다 상태가 달라질 수 있습니다(MVP용 간단 구현).
- 제공처 정보의 정확도/완전성은 TMDB Watch Providers 데이터 품질에 의존합니다.

