# unienv4u 그룹웨어 — 프론트엔드 (MVP)

경영진 시연용 MVP. React 18 + TypeScript + Vite. 데이터는 `src/mock/`의 mock API 계층으로 처리.

## 실행

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 데모 로그인
로그인 화면의 데모 버튼 클릭 시 자동 로그인. 권한별로 사이드바 메뉴가 달라진다.

| 계정 | 권한 | 표시 메뉴 |
|------|------|-----------|
| `admin@unienv4u.com` / `admin1234` | 마스터(대표이사) | 전체 16개 |
| `jo@unienv4u.com` / `jo123456` | 팀장(측정조사팀) | 그룹웨어·계약·환경질·장비 |
| `hong@unienv4u.com` / `hong1234` | 일반(측정조사팀) | 그룹웨어·계약·환경질·장비 |

## 구조
```
src/
├─ types/         도메인 타입 (백엔드 DTO 기준)
├─ mock/          시드 데이터 + mock API (→ 추후 HTTP 교체)
├─ lib/           권한(MENU_PERMS·canAccess)·연차 계산
├─ auth/          로그인 컨텍스트
├─ layout/        사이드바·메뉴 구성
├─ components/    공용 UI(카드·배지·테이블 훅)
└─ pages/         16개 모듈 페이지
```

기준 스펙: 루트 `spec_unienv4u_groupware_20260714.md` · 백엔드 계약: `../backend/README.md`
