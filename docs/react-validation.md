# React · Astryx 구현 및 검수

기준일: 2026-09-14. `codex/react-astryx-theme`에서 작업했으며 기준 staging은 `27f3414`입니다. 목표는 구현·검증·staging 대상 리뷰 준비입니다. main 병합, 테마 게시, 상품 생성/분리/이관은 하지 않았습니다.

## 구현

- Liquid 상품 form/앱 블록/비이미지 미디어를 유지하고 React tree 하나에서 갤러리·가격·구매 입력으로 portal을 연결했습니다. 일반 Liquid HTML에 hydrateRoot를 사용하지 않습니다.
- 실제 옵션 값 ID로 Section Rendering API를 요청합니다. 전체 variant 배열을 내려받지 않습니다. 없는 조합과 품절을 구분하고 마지막 요청만 적용하며, 오류/12초 타임아웃 시 재시도 또는 선택 URL로 이동할 수 있습니다.
- `variant`/`option_values` URL, 가격, 구매 가능 여부, 수량 규칙과 이미지 목록이 함께 갱신됩니다. 로케일·preview·기타 쿼리를 보존합니다.
- Astryx Selector, NumberInput(기본 위/아래 버튼), 썸네일 Carousel(edge fade 없음), 지연 로딩 Lightbox를 사용합니다. 사진 탐색은 구매 옵션과 독립적입니다.
- 초기 이미지는 Liquid eager 응답에 남기고, React 실패 시 기본 표시/폼을 유지합니다. 이미지 srcset/sizes/alt/크기를 보존하고 원본보다 큰 srcset 너비를 선언하지 않습니다.
- 카트는 기존 Shopify POST 폼과 항목별 `updates[]` 순서를 유지합니다. Ajax 카트 병합을 추가하지 않았으며 Shopify 반환 결과가 최종 기준입니다.
- 테마 편집기 load/unload 처리와 중복 초기화 방지, 요청/이벤트 정리를 추가했습니다. CLI dev는 최초 빌드 후 asset watch + full-page reload를 사용합니다.
- 기존 nara 전용 제목 폰트와 공통 팔레트/간격을 적용했습니다. 본문은 상용 웹폰트 재배포 범위를 확인하기 전까지 Helvetica 계열 fallback입니다.

## 판매/갤러리 조사

CLI에서 Dawn `175690613075`가 live, GitHub staging/main 테마가 unpublished, 작업 대상이 development인 것을 확인했습니다. 운영 상품 템플릿을 `.local/live-reference`로 읽어 가격·수량·구매 버튼 disabled와 `hide_variants: true`를 재확인했습니다.

따라서 `Enable purchasing`, `Show price`, accelerated checkout은 기본 off입니다. 실제 available 값으로 판매를 시작하지 않습니다. 상품 설명의 COMING SOON은 그대로 유지합니다. 이 기본 상품 템플릿을 쓰는 little family도 같은 구매 노출 설정을 적용받습니다.

family는 현재 item 7개·원본 이미지 9장, 선택 대표 이미지+공통 이미지 3장을 확인했습니다. little family의 실제 handle은 `little-family-by-nara`, 기본 variant 1개·이미지 20장입니다. 이 값/개수를 구현 분기로 사용하지 않습니다.

## 실행한 검사

| 검사 | 결과 |
| --- | --- |
| TypeScript | 통과 |
| Vitest 회귀 테스트 | 14개 통과: 수량 규칙/즉시 제출, 갤러리 ID 정규화, URL, 요청 경합·실패 |
| 프로덕션 빌드 | 통과; vendor 크기 경고는 아래 기록 |
| 산출물 재빌드 일치 검사 | 통과 |
| Theme Check | 43개 파일, 오류·경고 0 |
| theme.js 및 실행 스크립트 구문 / git diff 공백 | 통과 |
| npm audit | 설치 완료 시 취약점 0, production 의존성 0 |

로컬은 Node 26.4.0 / npm 11.17.0에서 검증했고, Node 24.11.0 / npm 11.6.1에서도 TypeScript·14개 테스트·생성물 일치 검사를 통과했습니다. `.nvmrc`와 CI는 Node 24입니다. React 19.3.0, Astryx/core·Neutral 0.6.0, StyleX 0.19.0, Vite 8.3.0 및 설치 버전은 package.json/lockfile에 고정했습니다.

## 브라우저 확인

Chrome 실제 브라우저와 Codex 내장 브라우저에서 확인했습니다. 내장 브라우저는 1280px 데스크톱과 390×844 모바일 viewport를 사용했습니다. Chrome의 실제 Shopify 개발 테마 CDN 로딩도 확인했습니다.

- 메인 상품 목록은 브랜드 스타일로 렌더링되고 React asset 요청이 0개인 것을 확인함.
- 실제 family의 Selector에 7개 item 값이 원문 그대로 표시됨. full set → sofa 선택 시 URL의 variant 및 대표 사진이 갱신되고 공통 사진 2장이 유지됨.
- Lightbox의 다음 사진 → Escape 닫기 → 메인 사진 2/3 유지, 시작 버튼 포커스 복귀 확인. 사진 탐색 후 item은 sofa 그대로 유지됨.
- little family는 Selector 없이 전체 20장 표시. 모바일에서 마지막 사진 선택 및 srcset 유지, 문서 너비 390px(가로 넘침 없음) 확인.
- 별도 **로컬 가상 상품**에서: 최소 2·증분 3 조건의 입력 7 → Enter 제출 8, 입력 11 → 클릭 제출 11. `id`와 `quantity` 각각 한 번만 제출. Chrome에서도 입력 7 → 클릭 제출 8 확인.
- 가상 다중 옵션에서 품절 조합은 그대로 선택/구매 불가, 없는 조합은 별도 안내/구매 불가. 다른 축을 바꿔 구매 가능한 조합으로 복구하고 뒤로/앞으로 상태 일치 확인.
- 가상 요청 실패에서 이전 variant 담기 차단, 재시도/선택 URL 링크 표시 및 페이지 이동 복구 확인.
- 가상 이미지 0장/1장, 기본 옵션 숨김, 섹션 unload/load 반복 및 중복 load에서 UI 한 개 유지 확인.
- 가상 카트의 동일 variant·서로 다른 속성 두 행에서 `updates[]=3`, `updates[]=5`가 순서대로 한 번씩 제출됨.

가상 상품은 `node scripts/preview-fixtures.mjs`로 실행합니다. `http://127.0.0.1:9293/products/fixture`와 `/cart`에서 확인하며 요청/제출은 로컬에만 남습니다. `?images=0`, `?images=1`, `?default`, `?slow`, `?fail`을 사용할 수 있습니다. Reload section 버튼은 편집기와 같은 이벤트를 발생시킵니다. 실제 Shopify 관리자 내부에서 저장 왕복을 검증한 것과는 구분합니다.

## 생성물 크기

`node:zlib.gzipSync` 기본 설정으로 측정한 값(십진 kB)입니다. Shopify의 실제 전송 압축과 캐시에 따라 달라집니다.

| 파일/묶음 | 원본 | gzip |
| --- | ---: | ---: |
| 초기 JS (entry + vendor + runtime) | 약 577.2 kB | 약 169.5 kB |
| 공통 UI CSS | 163.5 kB | 29.1 kB |
| 지연 Lightbox | 6.2 kB | 2.8 kB |
| Astryx BottomSheet 청크 | 30.2 kB | 9.9 kB |

React/Astryx asset은 상품·카트(및 테마 편집기)에서만 로드합니다. 목록은 Liquid/CSS를 유지합니다. Vite의 vendor 500kB 경고가 남아 있으며 성능 최적화 완료로 보고하지 않습니다. 단일 라이브러리 청크 분리는 Shopify의 버전 쿼리가 붙는 entry를 지연 청크가 다시 import해 React가 중복 초기화되는 문제도 방지합니다.

## 출시 전 남은 확인

- Safari/iOS 실제 기기, Firefox: 이번 자동화 연결에서 미확인.
- 실제 Shopify의 250개 초과 상품, 여러 옵션/없는 조합/품절, 이미지 변경·재정렬, 동영상/외부 동영상/3D, 필수 앱·selling plan 조합: 코드 경로는 유지/구현했으나 실제 해당 상품 데이터로 검수하지 않음.
- 실제 구매 활성화 후 수량→Shopify 카트 합계/할인/재고 오류/accelerated checkout/결제 진입 재검수. 현재 구매 노출 정책을 임의로 켜지 않았으며 주문·개인정보 입력을 하지 않음. 이전 기본 테마의 결제 검수 이력은 현재 React 구현의 통과 결과로 간주하지 않음.
- 진짜 Shopify 테마 편집기의 `dev:sync` 및 GitHub 설정 저장 왕복, PR 병합 이후 staging 연결 테마의 코드 반영.
- 본문 웹폰트 라이선스/원본, 출시 상품별 구매 노출 템플릿, 전용 variant 갤러리 매핑 필요 여부. [상품 입력 안내](product-content-guide.md) 참고.
- 출시 사본, main 전환, Dawn 복구 계획은 별도 배포 단계.

## 공식 참고

[Shopify 고변형 상품](https://shopify.dev/docs/storefronts/themes/product-merchandising/variants/support-high-variant-products), [옵션 값](https://shopify.dev/docs/api/liquid/objects/product_option_value), [Section Rendering](https://shopify.dev/docs/api/ajax/section-rendering), [Dawn 갤러리](https://github.com/Shopify/dawn/blob/main/snippets/product-media-gallery.liquid), [Astryx](https://github.com/facebook/astryx). 컴포넌트 API는 설치된 0.6.0의 공개 exports와 타입/소스에서 확인했습니다.

## Lightbox 이미지 전환 보정 (2026-09-14)

고해상도 Lightbox 이미지가 로드되기 전에 배경의 저해상도 이미지가 먼저 바뀌던 문제를 수정했습니다. 두 표시 크기의 이미지 다운로드/디코딩을 마친 뒤 선택을 함께 확정하고, 인접 이미지 1장씩을 미리 준비합니다. 대기 중에는 기존 이미지를 유지하고 Lightbox 안에 로딩 상태를 표시합니다. 실패 시 기존 선택을 유지하며 재시도할 수 있고, 닫기/상품 선택 변경 후 늦은 완료는 무시합니다. 추가한 회귀 테스트 3개를 포함해 총 17개입니다.

## Variant 전용 갤러리 확장 (2026-09-14)

Shopify 관리자에 `nara.gallery_images`(이미지 파일 목록), `nara.gallery_include_shared`(참/거짓) 정의를 생성했습니다. 실제 상품별 값은 입력하지 않았습니다. 목록을 입력하면 같은 상품 미디어에 존재하는 이미지 ID만 지정 순서로 표시하고, 선택적으로 공통 사진을 덧붙입니다. 비어 있거나 전부 유효하지 않으면 기존 정책으로 돌아갑니다. Liquid 초기 이미지와 React 초기/Section Rendering 데이터가 동일한 갤러리 계산을 사용합니다.

실제 Liquid 갤러리 snippet을 LiquidJS로 렌더링하는 4개 테스트를 추가했습니다. 순서·중복·외부/비이미지 참조 제외·공통 사진 덧붙임·빈 목록 fallback·전체 이미지 정책을 검증해 총 21개 테스트가 통과했습니다. 실스토어의 미지정 variant에서 기존 이미지 3장과 대표 이미지 유지도 확인했습니다. 실제 variant에 사진을 지정한 상태의 관리자→스토어 통합 검수는 사진 선택 후 진행해야 합니다.

## Staging 구매 검수 활성화 (2026-09-14)

사용자 요청으로 미공개 staging의 카트/체크아웃 검수를 위해 기본 상품 템플릿의 `enable_purchase`, `show_price`를 true로 설정했습니다. accelerated checkout은 기존 false를 유지하고 Add to cart → Cart → Shopify checkout 경로를 검수합니다. 상품 설명의 COMING SOON, 상품 데이터·재고·결제 설정은 변경하지 않습니다. **main으로 승격하기 전에 이 템플릿의 구매/가격 노출 설정을 실제 출시 결정과 대조해야 합니다.** 미공개 테마도 실제 스토어의 카트·체크아웃을 사용하며 별도의 테스트 결제 모드를 설정한 것은 아닙니다.

Staging 반영 확인: PR #1을 staging에 병합한 뒤 GitHub 연결 테마의 React/Astryx UI 및 구매 설정 반영을 브라우저에서 확인했습니다. 실제 little family 담기 → 카트 수량 1→2 및 €250→€500 합계 변경 → Shopify 체크아웃의 Contact/Delivery/Payment 입력 화면 진입 → 카트로 돌아와 테스트 항목 삭제/빈 카트 복원을 확인했습니다. 개인정보·배송지·카드 입력과 주문 제출은 하지 않았습니다. main과 운영 Dawn의 게시 상태는 변경하지 않았습니다. staging 병합 커밋의 CI도 통과했습니다.

## 오류 복구 패치 (2026-09-14)

- Lightbox의 지연 import/render 오류는 별도 boundary에서 처리합니다. 실패 안내·원본 이미지 새 탭 링크·닫기를 제공하며 현재 variant, 수량, 가격, 갤러리, 구매 폼을 유지합니다. 실패한 모듈의 재시도를 가장하지 않습니다.
- 옵션 요청의 URL과 history push 여부를 함께 보관합니다. 뒤로/앞으로 이동 중 실패한 요청은 재시도에도 새 history 항목을 만들지 않으며, 일반 옵션 선택의 재시도는 기존처럼 항목을 추가합니다.
- 갤러리 목록과 대표 이미지 선택을 같은 Liquid snippet에서 계산합니다. 유효한 전용 목록의 첫 이미지 또는 실제 연결된 대표 이미지만 `featuredMediaId`로 내보내고, 둘 다 없으면 null을 반환해 현재 사진 유지 규칙을 적용합니다.
- 회귀 테스트 5개 추가, 총 26개 통과. 실제 lazy import 실패를 주입한 ProductExperience 테스트에서 B/수량 5/가격/이미지/구매 가능 상태/URL 유지, 실제 jsdom history API로 A→B→C→뒤로→실패→재시도→앞으로 흐름, 일반 선택 재시도를 검증합니다. Liquid의 실제 JSON 필드와 공유 snippet으로 대표 이미지 우선순위도 검증합니다.
- 격리된 임시 디렉터리에서 수정 전 `a7dcdbc` 코드에 새 테스트를 적용하면 관련 4개 테스트가 실패합니다. 수정 후에는 전체 26개 테스트, TypeScript, Theme Check 44개 파일, 재빌드 assets 일치 검사가 통과합니다. 기존 vendor chunk 크기 경고는 남아 있습니다.
- 이번 패치의 오류 주입 검증은 로컬 자동화 기준입니다. 실기기 Safari/Firefox 및 실제 결제 검수를 새로 수행한 결과는 아닙니다.

### 로컬 OCR 결과와 처리 범위

`ocr 1.12.0`으로 수정 전에 `origin/main..origin/staging` (`a7dcdbc`) 리뷰를 시작했습니다. 결과는 22개 항목, 12개 지적(high 1 / medium 7 / low 4)이었습니다. 명령은 종료 코드 0이지만 핵심 React 소스의 2차 리뷰는 시간 초과, 빌드 도구 그룹의 context compaction 요청 하나는 취소됐습니다. 따라서 완전한 OCR 통과 결과로 보지 않습니다. 원문은 로컬 `.local/ocr-before-patch.txt`에 보관합니다.

- Lightbox 전체 UI 초기화(high), popstate 재시도 history 손실(medium)은 이번 패치와 회귀 테스트로 해결했습니다. 대표 이미지 없는 variant 문제는 첨부 검토와 Liquid 회귀 테스트를 기준으로 해결했습니다.
- `selectedEntity`에 따라 대표 이미지 우선순위를 바꾸라는 제안은 채택하지 않았습니다. 이 필드는 구매 대상 식별이며, 전용 목록 여부와 대표 이미지 우선순위는 Liquid에서 확정합니다. variant 갤러리에서도 실제 대표 이미지를 우선해야 합니다.
- payment 슬롯의 `DOMParser` → `importNode`가 inline script를 재실행한다는 주장은 현재 jsdom 재현에서 실행 횟수 0으로 확인됐습니다. 이 결과만으로 실브라우저의 가속 결제 동작까지 보장하지는 않으며, 결제 마크업을 임의로 제거하지 않았습니다. 현재 기본 템플릿의 가속 결제 노출은 꺼져 있습니다.
- Windows npm 실행/경로 관련 세 제안은 Windows 지원 검증 과제로 남깁니다. 이번 작업 환경은 macOS, CI는 Ubuntu이며 Windows에서 재현하지 않았습니다. 필수 DOM 노드 누락 지적은 현재 Liquid 템플릿에 해당 노드가 모두 있으므로 가정적인 다른 템플릿에 대한 보강 제안으로 분류했습니다.

## Pink store layout (2026-09-15)

Applied pink text (#FF8CD4), red structural accents, compact configurable standalone option badges, a sticky desktop gallery, and a shared minimal home/collection grid. Restored five editable detail blocks from the current Dawn template, scoped to family. The purchase caption is “add to the family”; “i’d like to order now” submits the existing add-to-cart form.

Cart typography is explicit in the shared CSS: it no longer depends on an Astryx quantity root activating theme-wide prose defaults. The empty state uses the same pink copy, red rule and outlined action styling.

Validation: 28 tests, TypeScript, deterministic asset rebuild, and Theme Check (46 files) passed. Browser checks covered variant selection, restored detail expansion, 1440px desktop and 390px mobile layouts, home/collection products, filled cart controls and the corrected empty cart. Store policy text was migrated rather than rewritten; live publication is not part of this change.

Local OCR 1.12.0 reviewed the scoped design diff (9 selected files, low effort) with zero findings and no reported failed review rounds. Generated bundles and content documents were excluded; Liquid files were separately checked by Shopify Theme Check and browser rendering. Report: `.local/ocr-pink-layout.txt` (local only).
