# 브랜드 자산 기록

2026-09-14에 사용자 지시의 브랜드 기준 사이트 [nara.world](https://nara.world/)와 `/collection/`을 확인했습니다.

- `assets/nara-display.woff2`: 브랜드 사이트의 `/assets/fonts/naraworldmmregular.woff2` 원본. 사용자가 요청한 동일 브랜드 테마의 로고/제목에 사용합니다. 별도 오픈소스 라이선스 파일은 확인되지 않았으며 Skeleton의 MIT 라이선스를 이 폰트에 적용하지 않습니다. 이 파일의 사용 권리는 브랜드 권리자에게 있습니다.
- Neue Haas Grotesk: 공개 사이트에서 원본 참조는 확인했으나 공개 저장소 재배포 허용 범위를 확인하지 못했습니다. 파일을 커밋하지 않고 Helvetica 계열 fallback을 사용합니다. 정식 웹폰트 라이선스/자산은 출시 전 확인 항목입니다.
- 상품 사진: Shopify 상품 미디어 CDN에서 렌더링하며 저장소에 복제하지 않습니다.
- React, Astryx, StyleX 및 Neutral의 이용 조건은 각 설치 패키지의 LICENSE에 따릅니다. 앱 생성물은 Vite 빌드 결과이며 외부 라이브러리의 저작권을 주장하지 않습니다.

## 2026-09-15 typography alignment

Reference: local `www.nara.world/dist/assets/css/bundle.1772706544.css`. Primary pink is `#ec9ac8`; structural red is unchanged. Body type uses 20px below 920px and 18px above, with 1.4 line-height. Product description and purchase actions use the reference `.txt-l` scale: 20px / 36px, line-height 1.1. Underlines use .08em offset and .1em thickness. Paragraph spacing is .45em. Shopify product headings keep their compact Nara Display scale; the reference's full-width 200px hero is not used in the product sidebar. Helvetica Neue remains the body/badge/accordion font; no additional font files were copied.
