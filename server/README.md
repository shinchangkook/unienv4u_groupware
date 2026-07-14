# unienv4u 그룹웨어 백엔드 (Phase 0~1)

`uni_build_20260714.md` 구축 가이드의 **Phase 0~1(기반 + 인증)** 구현체입니다.
Node + Express + SQLite로 회원가입·승인·로그인·로그아웃과 회원 관리 API를 제공하고,
기존 `index.html` 프론트엔드가 서버에 연동되도록 데이터 어댑터(`../js/uni-store.js`)를 붙였습니다.

## 기술 스택
- **런타임**: Node.js ≥ 22.5 (내장 `node:sqlite` 사용 — 별도 DB 설치 불필요)
- **웹**: Express 4
- **인증**: JWT(`jsonwebtoken`) + 비밀번호 해시(`bcryptjs`)
- **DB**: SQLite 파일(`data/groupware.db`)

## 실행 방법

```bash
cd server
npm install
cp .env.example .env      # 최초 1회. JWT_SECRET 을 무작위 값으로 바꾸세요.
npm start                 # http://localhost:4000
```

- `npm run dev` — 파일 변경 시 자동 재시작(`node --watch`)
- `npm run seed` — 회원 시드 수동 실행(비어 있을 때만 삽입)

서버를 켜면 `http://localhost:4000/` 에서 **`index.html` 프론트가 서버와 연동된 상태**로 열립니다.
서버 없이 `index.html` 을 파일로 직접 열면 기존처럼 **localStorage 모드로 자동 폴백**됩니다.

## 초기 계정 (index.html 의 INIT_MEMBERS 이관)
비밀번호는 최초 시드 시 bcrypt 해시로 저장됩니다(평문 미보관).

| 구분 | 아이디 | 비밀번호 |
|------|--------|----------|
| 마스터 관리자 (신창국) | `admin` | `admin1234` |
| 일반 사용자 (홍길동) | `hong` | `hong1234` |
| 승인 대기 (신입사원) | `new` | `new12345` |

> 아이디에 `@`가 없으면 자동으로 `@unienv4u.com` 이 붙습니다.

## API 요약

### 인증 `/api/auth`
| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|:---:|
| POST | `/signup` | 회원가입(승인 대기 생성) | — |
| POST | `/login` | 로그인 → `{ token, user }` | — |
| GET | `/me` | 내 정보(토큰 검증) | ● |
| POST | `/logout` | 로그아웃(감사 로그 기록) | ● |

### 회원 `/api/members` (전부 인증 필요)
| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|:---:|
| GET | `/` | 회원 목록(일반=승인자, 관리자=전체) | 로그인 |
| GET | `/pending` | 승인 대기 목록 | 관리자 |
| POST | `/:email/approve` | 가입 승인(사번 자동 부여) | 관리자 |
| POST | `/:email/reject` | 가입 거절 | 관리자 |
| PATCH | `/:email` | 회원 수정(본인=일부/관리자=전체) | 본인·관리자 |

### 업무 도메인 `/api/domains/:domain` (Phase 2 — 모델링 테이블)
`clients`(거래처) · `contracts`(계약, 프론트 `uni_ctu`) · `billings`(청구/수금, `uni_billing`) ·
`env`(환경 성적서, `uni_env`) 를 **전용 테이블(핵심 컬럼 + payload JSON)** 로 저장. 필수값 검증 포함.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/:domain` | 목록(payload 전체 객체 배열) |
| PUT | `/:domain` | 배열 전체 교체(검증 실패 시 400·롤백) |
| POST | `/:domain` | 단일 upsert |
| DELETE | `/:domain/:id` | 단일 삭제 |

### 객체형 KV `/api/kv/:key` (Phase 2·3)
배열이 아닌 객체형 도메인용. 허용 키: `det_mno`(관리번호 override), `lv_settings`(휴가설정),
`annual`(연차), `memos`(메모 로그), `menu_perms`(메뉴권한). GET/PUT.

### 연차 계산 `/api/leave` (Phase 3 — 서버 권위 계산)
근로기준법 근속 티어 기반 연차 자동계산을 서버에서 단일 기준으로 제공.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/calc-annual` | `{hireDate\|email, year}` → 생성 연차일수 |
| POST | `/summary` | `{email, fromYear, toYear}` → 연도별 생성+이월(최대 10일) 요약 |

### 전자결재 `/api/approvals` (Phase 4, 인증 필요)
기안 → 결재선 순차 승인/반려 워크플로우. 결재선의 **현재 단계 결재자만** 처리 가능(관리자 예외).

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/?box=inbox\|outbox\|all` | 결재함/기안함/전체 |
| GET | `/:id` | 단건(결재선 포함) |
| POST | `/` | 기안 `{title, type, content, approvers:[email,...]}` |
| POST | `/:id/approve` | 현재 단계 승인(다음 단계로 진행/종결) |
| POST | `/:id/reject` | 반려(`reason` 필수) |

### 첨부파일 `/api/files` (Phase 4, 인증 필요)
성적서 등 첨부. 본체는 `data/uploads/`, 메타는 `attachments` 테이블. base64 JSON 업로드.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/` | 업로드 `{domain, targetId, filename, mime, dataB64}` |
| GET | `/?domain=&targetId=` | 목록(메타) |
| GET | `/:id` | 원본 다운로드 |
| DELETE | `/:id` | 삭제 |

### 주민번호(민감정보) `/api/members/:email/jumin` (Phase 4)
**AES-256-GCM** 서버 암호화로 저장(기존 `btoa` 대체). 조회는 **마스킹**만 반환하며 접근이 감사 로그에 기록됨.
본인 또는 관리자만 가능. 키는 `.env` 의 `JUMIN_KEY`(미설정 시 JWT_SECRET 파생, 운영은 별도 지정).

| 메서드 | 경로 | 설명 |
|--------|------|------|
| PUT | `/:email/jumin` | 저장 `{jumin}` → 마스킹 반환 |
| GET | `/:email/jumin` | 마스킹 조회(`view_jumin` 감사) |

### 인앱 알림 `/api/notifications` (Phase 5, 인증 필요)
전자결재 이벤트(기안 상신·승인·반려) 발생 시 관련자에게 알림 생성. 상단바 벨 배지로 표시.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/?unread=1&limit=30` | 내 알림 목록 + 안읽음 수 |
| GET | `/count` | 안읽음 개수 |
| POST | `/:id/read` | 단건 읽음 |
| POST | `/read-all` | 전체 읽음 |

> SMTP 메일 발송은 `notifications.create()` 내부 훅 지점에 추가 가능(후속 확장).

### 범용 문서 `/api/data/:domain` (블롭)
`leaves, memos, menu_perms` 등 배열 도메인 임시 수용(GET/PUT/POST/DELETE).

## 배포 (Docker)
프론트(index.html)까지 단일 컨테이너로 서빙.

```bash
# 루트에서
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
export JUMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
docker compose up -d --build       # http://localhost:4000
```
- 데이터(SQLite·업로드)는 `groupware-data` 볼륨(`/app/server/data`)에 영속.
- 운영은 앞단에 **HTTPS 리버스 프록시(Nginx/Caddy)** 를 두고 `CORS_ORIGIN` 을 도메인으로 제한.

## 백업
```bash
npm run backup            # data/backups/groupware-YYYYMMDD-HHMMSS.db (VACUUM INTO 일관 스냅샷)
```
첨부파일 `data/uploads/` 도 함께 보관. 크론 예: 매일 새벽 3시 `0 3 * * * cd .../server && npm run backup`.

### 프론트 동기화 방식 (`../js/uni-store.js` → `UniSync`)
- **로그인 시 하이드레이트**: 서버 데이터를 localStorage 로 내려받음(서버 우선). 서버가 비어 있고
  로컬에 시드가 있으면 **로컬 → 서버 최초 이관**.
- **쓰기 미러링**: `uni_clients / uni_ctu / uni_billing / uni_env / uni_det_mno` 저장을 가로채
  서버로 디바운스(400ms) 반영. 기존 화면 코드 수정 없이 서버 영속화.

## 인증 방식
- 로그인 성공 시 **JWT 액세스 토큰**을 발급하여 프론트가 `localStorage['uni_token']` 에 보관.
- 이후 요청은 `Authorization: Bearer <token>` 헤더로 인증.
- 미들웨어가 매 요청마다 DB에서 계정 상태를 재확인(정지/삭제 즉시 반영).

## 보안 메모 (운영 전 확인 — 가이드 §9)
- `.env` 의 `JWT_SECRET` 을 반드시 강력한 무작위 값으로 교체.
- HTTPS 뒤에 배포(리버스 프록시), CORS 오리진 제한(`CORS_ORIGIN`).
- 주민번호는 현재 **수집/저장하지 않음**(스키마에 자리만 존재). 필요 시 서버 AES 암호화로 별도 구현.
- `data/` 디렉터리(SQLite 파일)는 정기 백업 대상.

## 다음 단계 (운영 고도화)
- 전자결재 기존 DOM 화면을 서버 워크플로우(`UniApproval`)로 완전 치환.
- 결재/승인 알림 메일(SMTP), 실시간 반영.
- HTTPS 리버스 프록시 배포, 스케줄 백업(cron), 모니터링.
- (선택) SQLite → PostgreSQL 이전(동시 쓰기·규모 확대 시).

각 화면의 localStorage 접근을 점진적으로 명시적 `UniStore`/`UniSync`/`UniApproval` 호출로 치환해 나갑니다.
