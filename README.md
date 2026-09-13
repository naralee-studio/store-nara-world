# Nara Studio · Shopify theme

[store.nara.world](https://store.nara.world)를 위한 커스텀 테마의 첫 개발 구성입니다. Shopify 공식 [Skeleton](https://github.com/Shopify/skeleton-theme)에서 시작했으며, Dawn을 수정하거나 업데이트한 프로젝트가 아닙니다. 메인 제품 리스트와 상품 상세를 중심으로 한 미니멀 구성입니다. 출시 모드는 `prepare`입니다.

## 시작하기

Node.js **24 LTS**를 권장합니다 (지원: 22.12+, 24, 26 이상 짝수 릴리스). `.nvmrc`와 CI는 Node 24 LTS를 사용합니다. npm, Git이 있으면 전역 Shopify CLI 설치는 필요 없습니다.

```sh
cd store-nara-world
npm ci
npm run typecheck
npm test
npm run assets:check
npm run check
npm run dev
```

첫 실행 시 브라우저에서 **스토어 소유자 또는 테마 권한이 있는 계정**으로 Shopify CLI에 로그인합니다. CLI가 준비 완료를 출력하면 [로컬 프리뷰](http://127.0.0.1:9292)를 Chrome에서 엽니다. 실제 스토어 데이터를 사용하는 연결형 프리뷰이므로, 인증 전에는 열리지 않습니다. 서버 종료는 실행 터미널에서 `Ctrl+C`입니다. 로컬에서 Shop Pay 전환 시 HTTP 401이 관찰됐으므로 결제 검수는 CLI가 출력한 Shopify 직접 프리뷰에서 진행합니다. 기존 기본 테마 단계에서 직접 프리뷰의 결제 화면 진입을 확인했습니다. 이번 React 변경에서 실제 주문을 생성하지 않았으며, 구매 활성화 후 재검수해야 합니다.

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 최초 Vite 빌드 후 asset watch + Shopify 로컬 프리뷰 |
| `npm run build` | Shopify에 커밋할 JS/CSS 산출물 생성 |
| `npm run typecheck` / `npm test` | TypeScript 및 회귀 테스트 |
| `npm run assets:check` | 재빌드 후 커밋할 산출물과 일치 검사 |
| `npm run assets:watch` | asset 빌드만 감시 |
| `npm run dev:sync` | 개발용 테마 편집기 변경을 로컬로 동기화 |
| `npm run check` | Theme Check, 경고도 실패 처리 |
| `npm run theme:list` | 실제 스토어 테마 ID와 역할 확인 |
| `npm run theme:info` | 연결 정보 확인 |

Liquid 테마를 유지하며 React 19.3.0 + TypeScript + Astryx 0.6.0을 Vite 8.3.0으로 빌드합니다. `src/`를 수정한 뒤 `assets/nara-ui*` 생성물을 함께 커밋합니다. GitHub 연결은 빌드를 수행하지 않습니다. CSS와 청크는 Shopify assets CDN에서 상대 경로로 로드하고, 기존 assets 파일은 지우지 않습니다. 로컬 재로딩은 React DOM 교체 충돌을 피하도록 전체 페이지 새로고침을 사용합니다. CLI 4.8.0을 프로젝트 의존성과 lockfile로 고정했습니다. `shopify.theme.toml`의 `development` 환경은 `9uqxpe-qv.myshopify.com`만 지정하며 고정 테마 ID나 공개 옵션을 포함하지 않습니다.

## 구성

- 메인: 제품 이미지·이름·가격으로 구성한 목록. 소개 배너 없이 바로 제품을 보여주며, 편집기에서 컬렉션과 페이지당 제품 수를 선택합니다.
- 상품 목록: 반응형 목록, 정렬, 페이지 나누기, 빈 목록.
- 상품 상세: 큰 이미지와 한 줄 썸네일, 선택 옵션의 가격·이미지·재고·수량 규칙, 상품 폼과 앱 블록. 옵션 변경은 Section Rendering API로 상태를 갱신하며 URL·수량·이미지를 함께 유지합니다. Astryx Selector, NumberInput, Carousel, Lightbox를 사용합니다. 구매·가격 노출은 운영 설정을 보존해 기본적으로 꺼져 있습니다.
- 장바구니: 옵션과 속성, 할인, 수량 변경·삭제, 합계, Shopify 결제 진입.
- 검색: 상품·페이지·글, 빈 결과, 페이지 나누기. 일반 페이지와 404도 포함.
- 기존 Skeleton의 블로그·글·컬렉션 목록·기프트 카드·비밀번호 템플릿 유지.
- 로고·장바구니만 있는 헤더, 푸터 없는 화면, 키보드 포커스, 본문 바로가기, canonical·메타·상품 구조화 데이터. Contact 폼·메뉴와 홈 소개 섹션은 포함하지 않습니다.
- 영어 UI가 기본이며 가격·통화는 Shopify의 현재 마켓 컨텍스트를 따릅니다. 수동 국가·언어 선택 UI와 한국어·일본어 번역은 이번 구성에 포함하지 않습니다.

옵션 값 API를 사용해 전체 variant 배열을 전송하지 않습니다. 실제 250개 초과 상품, 구독·번들·각인 기능은 아직 실스토어 검수 대상입니다. 상품 구성 변경과 사진 관리 방법은 [관리자 안내](docs/product-content-guide.md), UI 규칙은 [디자인 기준](docs/design.md), 이번 검증은 [React 검수 기록](docs/react-validation.md)을 참고합니다.

## GitHub와 테마 연결

공개 저장소: [naralee-studio/store-nara-world](https://github.com/naralee-studio/store-nara-world). Shopify가 읽는 표준 테마 디렉터리는 저장소 최상위에 있습니다.

| 브랜치 | 연결 대상 / 규칙 |
| --- | --- |
| `codex/*` 또는 `feature/*` | 로컬 개발용 테마, PR로 변경 검토 |
| `staging` | `store-nara-world/staging` · ID `206922154323` · 연결 완료, **미공개** 검수 테마 |
| `main` | `store-nara-world/main` · ID `206922318163` · 연결 완료, 현재 **미공개**. 첫 출시 후 운영 브랜치 |

2026-09-13에 사용자가 두 브랜치를 Shopify 관리자에서 각각 연결했습니다. CLI에서 두 테마의 미공개 상태를 확인하고 브라우저에서 프리뷰를 확인했습니다. 운영은 기존 Dawn (`175690613075`)이며, CLI 개발 테마 (`206919729491`)는 별도로 유지합니다.

다음 실제 코드 변경 때 `staging` 프리뷰 반영을 확인하고, 편집기 설정 저장이 해당 브랜치의 커밋으로 돌아오는지 별도 검증합니다. 현재 검증 범위는 [상태 문서](docs/status.md)에 기록합니다. GitHub 연결 테마에 CLI 자동 push를 겹쳐 사용하지 않습니다. CI는 검사만 수행합니다.

## 설정 보존과 공개 범위

`config/settings_data.json`, `templates/*.json`, `sections/*.json`은 관리자 설정입니다. Git에서 추적하며 통째로 초기화하지 않습니다. 개발 전 원격 변경을 받고, `main`의 운영 설정을 `staging`에도 반영합니다. 병합 전에 테스트 문구·배너·이미지가 섞이지 않았는지 비교합니다. 같은 설정 파일을 편집기와 로컬에서 동시에 수정하지 마세요.

Shopify GitHub 연동은 관리자 변경을 자동 커밋하며 이를 끄는 설정은 없습니다. 공개 저장소에는 설정·문구·이미지 참조와 커밋 이력도 공개됩니다. `.gitignore`와 `.shopifyignore`는 GitHub 앱의 커밋을 막지 못합니다. 비밀키·고객정보·비공개 캠페인과 프리뷰 접근 링크를 커밋하지 않습니다. 테마 연동이 고객·주문 DB를 저장소로 복제하는 것은 아닙니다.

## 공개와 복구

1. [검수 항목](docs/status.md)을 완료하고 기존 Dawn, 새 테마 ID, 연결 브랜치, 출시 커밋과 최신 설정을 확인합니다.
2. 출시 시점의 테마 사본 또는 코드·설정 스냅샷을 보존합니다.
3. 이번 단계는 `prepare`이므로 공개하지 않습니다. 이후 출시할 때 **main 연결 테마**를 관리자에서 공개합니다. `staging` 테마를 공개하면 연결 브랜치도 staging으로 유지됩니다.
4. 첫 전환에 문제가 생기면 보존한 Dawn을 다시 공개합니다. 이후 업데이트는 출시 사본 또는 검토한 revert로 복구합니다. 과거 커밋을 복원하면 운영 설정도 되돌아갈 수 있습니다.

미공개 테마도 상품·가격·재고·주문·메뉴·앱·결제 설정은 운영 스토어와 공유합니다. 격리 테스트가 필요하면 별도 개발 스토어를 사용합니다. 실제 주문은 기본 검수에 포함하지 않습니다. 공유 프리뷰 링크는 만료될 수 있으며 영구 스테이징 주소가 아닙니다.

Dawn 버전 업데이트는 이 테마의 유지보수 대상이 아닙니다. 사용하는 Shopify 기능·Liquid·Ajax API·앱·CLI와 자체 코드를 점검하고, 변경 시 Theme Check와 관련 구매 흐름을 검증합니다.

## 출처

Skeleton 기준 커밋: `a4f32d393b9eadf6c4403318ca39116832e5d1df` (2026-09-13). 원저작권과 이용 조건은 [LICENSE.md](LICENSE.md)에 보존했습니다. 상품 사진은 Shopify 상품 데이터에서 렌더링하며 이미지 원본을 저장소에 복제하지 않습니다.

공식 문서: [테마 시작](https://shopify.dev/docs/storefronts/themes/getting-started/create), [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev), [환경](https://shopify.dev/docs/storefronts/themes/tools/cli/environments), [GitHub 연동](https://shopify.dev/docs/storefronts/themes/tools/github).
