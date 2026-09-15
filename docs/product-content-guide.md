# 상품 콘텐츠 관리

상품·옵션·사진은 Shopify 관리자에서 관리합니다. 이 테마에는 상품 handle, 현재 상품 개수, 옵션 이름, 색상 이름으로 분기하는 코드가 없습니다. 사진 추가나 상품 구성 변경만으로 테마를 다시 빌드할 필요는 없습니다.

## 옵션과 상품 구성

Shopify 상품의 **옵션**에 실제 판매하는 축과 값을 입력합니다. 하나의 item 값에 모델과 색상이 함께 적혀 있으면 하나의 값 그대로 표시합니다. 여러 옵션 축을 정의하면 각 축에 Selector가 생깁니다. 기본 variant만 있는 상품은 선택 UI를 생략합니다.

다른 선택은 유지하며 새 조합을 조회합니다. 품절은 선택하고 사진을 볼 수 있지만 담기가 꺼집니다. 존재하지 않는 조합은 다른 조합으로 자동 대체하지 않습니다. 옵션에 연결된 다른 상품 URL은 그 상품으로 이동합니다.

현재 variant 구성 유지와 개별 가구를 별도 상품으로 만드는 방안 모두 가능합니다. 별도 상품을 만들기로 결정하면 Shopify에서 상품과 미디어를 등록하고 홈 컬렉션에 포함하면 됩니다. 이번 구현은 상품 생성·분리·데이터 이관을 하지 않았습니다.

## 갤러리

1. 상품 **미디어**에서 사진을 추가하고 원하는 순서로 정렬합니다. alt는 사진 설명에 사용합니다.
2. variant 편집에서 해당 variant의 대표 이미지를 연결합니다.
3. 테마 편집기 → 해당 상품 템플릿 → Product → **Image gallery**를 선택합니다.

| 정책 | 표시 목록 |
| --- | --- |
| Selected variant and shared images (기본) | 선택 variant의 대표 이미지 먼저, 이어서 다른 variant에 연결되지 않은 공통 이미지 |
| All product images | 관리자에서 정렬한 상품 전체 이미지 |
| 기본 variant 하나만 있는 상품 | 정책과 관계없이 전체 이미지 |

공통 사진을 특정 variant에 연결하면 다른 variant의 갤러리에서 숨겨집니다. 파일명·alt·색상 문구로 사진 그룹을 판단하지 않습니다. 동영상·외부 동영상·3D는 이미지 갤러리 아래의 Shopify 미디어 영역에 표시합니다.

### variant 전용 이미지 목록

Shopify 설정 → 메타 필드 및 메타 객체 → **이형 상품**에 아래 정의를 생성했습니다 (2026-09-14).

| 표시 이름 | 네임스페이스·키 | 형식 |
| --- | --- | --- |
| Gallery images | `nara.gallery_images` | 파일 목록 (`list.file_reference`), 이미지 전용 |
| Include shared gallery images | `nara.gallery_include_shared` | 참/거짓 (`boolean`), 미입력은 false |

상품 → 해당 variant를 열고 **Gallery images**에서 사진을 선택하고 순서를 정합니다. 같은 파일을 먼저 해당 상품의 미디어에도 추가해야 합니다. 별도로 다시 업로드한 복제 파일은 다른 ID이므로 원래 상품에 등록한 파일을 선택하세요.

- 유효한 목록이 있으면 지정 순서로 표시하며 첫 이미지에서 시작합니다. 기존 variant 대표 이미지가 목록에 없어도 자동으로 끼워 넣지 않습니다.
- 공통 사진을 뒤에 붙이려면 **Include shared gallery images**를 true로 설정합니다. 중복 사진은 한 번만 표시합니다.
- 목록이 없거나 비어 있거나 유효한 이미지가 하나도 없으면 기존 대표 이미지 + 공통 이미지 정책을 사용합니다.
- 삭제된 파일, 다른 상품에만 있는 파일, 이미지가 아닌 파일은 제외합니다. 일부만 유효하면 유효한 사진의 지정 순서를 유지합니다.
- 테마 설정에서 **All product images**를 고르면 전용 목록보다 전체 이미지 정책을 우선합니다. 기본 variant만 있는 상품도 기존 전체 이미지 정책을 유지합니다.

**family처럼 variant별 사진을 확실히 분리하려면**, 모든 variant의 Gallery images에 표시할 사진을 빠짐없이 지정하고 Include shared gallery images는 false로 유지하세요. 공통 치수 사진도 필요한 각 목록에 직접 넣습니다. 공통 사진 판별은 Shopify 기본 variant 대표 이미지 연결만 기준으로 합니다. 다른 variant의 메타필드 목록에만 들어 있는 추가 사진은 여전히 공통 사진으로 취급될 수 있습니다. 목록이 없는 variant는 기존 정책으로 돌아가므로 일부 variant에만 목록을 지정하는 것으로 완전히 분리되지는 않습니다.

옵션 변경 시 유효한 전용 목록이 있으면 그 첫 사진, 그렇지 않으면 연결된 대표 사진을 우선합니다. 둘 다 없으면 현재 사진이 새 목록에도 있을 때 유지하고, 없을 때만 첫 사진으로 이동합니다.

내부 데이터 계약은 `selectedEntity`, `mediaIds`, `featuredMediaId`, `mediaById`이며, 위 메타필드를 이 계약으로 변환합니다. Liquid 첫 이미지와 React 갤러리가 동일한 목록 계산을 공유합니다.

추가·삭제·재정렬은 다음 페이지 로드/옵션 상태 요청부터 반영됩니다. 열린 화면에 관리자 변경을 실시간으로 전송하는 기능은 없습니다.

## 판매 개시와 가격 노출

운영 Dawn의 기본 상품 템플릿에서 가격·수량·구매 버튼이 비활성화된 것을 확인했습니다. 새 템플릿도 **Enable purchasing**, **Show price**, **Show accelerated checkout**를 기본으로 끕니다. `available` 재고 값이나 설명 문구로 판매 개시를 추정하지 않습니다.

판매할 상품이 확정되면 승인된 상품 템플릿에서 가격/구매를 켭니다. 같은 템플릿을 쓰는 모든 상품에 적용되므로 출시 시점이 다르면 관리자에서 상품 템플릿을 복제하고 해당 상품에 배정합니다. 기존 COMING SOON 문구는 상품 설명에서 직접 정리합니다. 테마의 노출 설정은 Shopify 상품 판매 채널이나 재고에 대한 접근 제어를 대체하지 않습니다.

수량 규칙은 variant의 Shopify `quantity_rule`에서 가져옵니다. 별도의 임의 최대 재고 값을 넣지 않습니다. 최소값을 기준으로 증분을 계산하고 최대값 안의 유효 수량으로 보정합니다. 카트 삭제는 Remove 링크로 합니다.

## 브랜드 자산과 번역

- 제목/로고: 기존 nara 사이트의 전용 `naraworldmmregular` 원본 사용. 출처와 범위는 [자산 기록](brand-assets.md).
- 본문: 현재 Helvetica Neue / Helvetica / Arial fallback. Neue Haas Grotesk 웹폰트의 스토어 사용 및 공개 저장소 재배포 범위가 확인되면 정식 자산으로 교체합니다.
- 공통 값: `assets/critical.css`의 `--nara-*`; Astryx 매핑은 `src/nara-theme.tsx`.
- 고객 문구: `locales/en.default.json`. 추가 언어는 Shopify locale 파일과 번역으로 관리합니다. 새로운 UI는 현재 영어가 기본입니다.
- 노랑·하늘색·초록·빨강은 브랜드 그래픽 팔레트입니다. 실제 상품 색상으로 해석하지 않습니다.

## 핑크 스토어 프리뷰 (2026-09-15)

기본 텍스트와 미선택 옵션 이름은 `#FF8CD4`입니다. 옵션 테두리·선택 배경·포커스·구분선·hover 밑줄·조작 아이콘은 레드이며, 선택된 옵션 배지의 글자는 흰색입니다. 카트 Update/Checkout, 빈 상태 링크 버튼, 검색·비밀번호 제출 버튼은 투명 배경·레드 테두리·핑크 문구를 사용합니다. 입력값·placeholder·보조 라벨도 핑크로 통일합니다. 구매 영역의 `add to the family`는 안내 문구이며, `i’d like to order now`는 기존 장바구니 담기 form을 제출합니다. 데스크톱에서는 왼쪽 갤러리가 고정되고 오른쪽 상세 내용이 스크롤됩니다. 모바일에서는 고정을 풀고 한 열로 표시합니다.

Product 섹션의 **Separate option badge**에 입력한 옵션 값(기본 `Full set`)을 별도 줄에 표시합니다. 대소문자를 구분하지 않으며, 나머지 값은 Shopify 옵션 순서를 유지합니다. 상품 handle이나 특정 variant ID를 코드에 넣지 않습니다. 모든 값은 키보드로 선택할 수 있고 품절 옵션도 사진 확인을 위해 선택 가능합니다.

기존 Dawn의 아코디언은 상품 데이터가 아닌 해당 테마의 `templates/product.json` 블록 설정에 저장돼 있었습니다. 최신 운영 테마에서 Dimensions / Materials / Weight / Shipping & Returns / FAQ 내용을 읽어 커스텀 테마의 **Detail accordion** 블록으로 옮겼습니다. Shopify 테마 편집기 → Products → Default product → Product에서 제목, 본문, 연결 페이지, 순서를 수정할 수 있습니다.

각 Detail accordion 블록의 **Content scope**에서 공통/특정 상품을 선택합니다. 특정 상품은 **Only for product**로 지정하며, 선택이 없거나 상품이 삭제되면 블록을 숨깁니다. 본문에는 상품 메타필드를 동적 소스로 연결할 수도 있습니다. 현재는 Dawn 내용을 검증해 테마 블록으로 이전했으며, 상품 메타필드 정의·값의 일괄 생성은 아직 하지 않았습니다.


## little family와 공통 콘텐츠 (2026-09-15)

현재 Dawn의 기본 템플릿은 little family에도 가구용 치수/소재/65kg/4개월 제작 안내/커버 FAQ를 표시하고 있었습니다. little family 본문에서 확인된 32×24×4cm, 1.8kg, 14개 미니어처, 99개 한정, 한국 수제작 정보만 해당 상품 블록과 FAQ에 사용했습니다. 소재·관리법·발송 기간은 소유자 확인 후 추가합니다.

Shipping & Returns의 국제배송/배송지에 따른 요금/반품·결함 대응·연락처는 공통 블록으로 분리했습니다. 4개월 제작 기간과 주문 제작 문구는 family의 Production & Delivery에만 표시합니다. family의 기존 설명 중 washable 문구와 FAQ의 dry-clean-only 문구는 여전히 서로 달라 상품 설명 관리자가 확인해야 합니다.

Share는 복사할 수 있는 상품 URL을 표시하는 기본 링크 공유 UI입니다. 다른 상품 링크는 서버 HTML에서 렌더링하며, Shopify의 개인화 추천 API를 재현한 것은 아닙니다. 둘 다 Product 섹션 설정에서 숨길 수 있습니다.

## 검색 메타데이터

- 상품 JSON-LD는 Shopify `structured_data` 필터로 한 번 출력합니다. little family는 Product/Offer, family는 ProductGroup과 각 variant Offer를 사용합니다. 임의의 평점·GTIN·배송 요금은 추가하지 않습니다.
- nara.world의 Organization ID를 공유하고 스토어는 별도 WebSite/Page ID를 사용합니다. Brand structured data 설정에서 브랜드 URL과 공개 이메일을 관리합니다. CollectionPage와 BreadcrumbList는 스토어 URL로 생성하고, 브랜드 사이트에만 있는 영상 스키마는 복사하지 않습니다.
- FAQ는 서버 HTML에 제공합니다. Google은 2026년 5월 FAQ 리치 결과 표시를 중단했습니다. https://developers.google.com/search/updates
- 배포 검증: `node scripts/check-product-seo.mjs http://127.0.0.1:9292 /products/little-family-by-nara /products/family`로 JSON 파싱, canonical, Offer, 가격/통화, 스키마 연결과 아코디언 적용 범위를 확인합니다. Google Rich Results Test나 실제 검색 노출 보장과는 별개입니다.
- 테마 개발 서버가 새 schema와 template을 동시에 올리면 새 설정값이 유실될 수 있습니다. 실제 HTML에서 적용 범위를 확인하고 필요하면 section/schema를 먼저 올린 다음 template/settings를 다시 동기화합니다.
