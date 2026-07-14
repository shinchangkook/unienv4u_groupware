# 개발 스펙 사양서 — unienv4u 그룹웨어 v0.9.33

- **작성일**: 2026-07-14
- **분석 원본**: `docs/unienv4u_groupware_v0.9.33.html` (5,994줄 / 약 647KB, `index.html`과 바이트 동일)
- **문서 목적**: v0.9.33 단일 HTML SPA를 **재개발/서버 이관/유지보수**할 수 있도록 구조·데이터·비즈니스 규칙을 역분석한 개발 기준 스펙
- **대상 회사**: 유앤아이환경기술(주) — 환경측정·분석 전문기업
- **관련 문서**: `spec_20260714.md`(v0.8→v0.9.33 변경 이력), `README.md`, `CHANGELOG.md`

> 본 문서는 "무엇이 바뀌었나"(변경 이력)가 아니라 **"현재 무엇으로 이루어져 있으며 어떻게 동작하는가"** 를 기술하는 개발 스펙입니다.

---

## 1. 아키텍처 개요

| 항목 | 내용 |
|------|------|
| 형태 | **단일 파일 SPA** — HTML + 내장 CSS + Vanilla JS, 빌드/번들 단계 없음 |
| 실행 | `index.html`을 브라우저로 열면 즉시 동작. 서버·API 불필요 |
| 언어/기술 | HTML5, CSS3(커스텀 프로퍼티), ES6+ Vanilla JavaScript(프레임워크 無) |
| 영속 계층 | 브라우저 `localStorage` (11개 도메인 키, JSON 직렬화) |
| 아이콘 | Tabler Icons (`<i class="ti ti-*">`, CDN) |
| 테마 | CSS 변수 기반 라이트/다크 (`@media(prefers-color-scheme:dark)`) |
| 반응형 | 브레이크포인트 `768px`(태블릿), `480px`(모바일) |
| 인쇄 | `window.print()` 팝업(`window.open`)으로 성적서/보고서/인사기록카드 출력 |

### 1.1 파일 내부 레이아웃 (줄 범위)

| 영역 | 줄 범위 | 설명 |
|------|---------|------|
| `<style>` 전역 CSS | 8–256 | 테마 변수, 레이아웃, 컴포넌트 스타일 |
| 인라인 컴포넌트 스타일 | 343 | 하단 퀵아이콘 바(`.fv-*`) |
| HTML 마크업 (로그인·사이드바·패널·모달) | ~257–1696 | 모든 화면 정적 마크업 |
| **메인 스크립트** | **1697–5353** | 전 로직(라우팅·권한·CRUD·렌더·계산) |
| 인쇄용 임베드 템플릿 | 4172–4199, 4664–4686 | 별도 창 인쇄 HTML |

> 단일 파일 특성상 **전역 네임스페이스**를 공유한다. 함수 정의 187건(고유 이름 183개)·전역 상수/변수가 하나의 `<script>`에 존재.

---

## 2. 라우팅 · 화면 전환 모델

프레임워크 라우터 없이 **패널 show/hide** 방식으로 SPA를 구현한다.

### 2.1 페이지 전환 `sp(id, el)` (index.html:1740)
1. `canAccess(id)` 권한 체크 → 실패 시 `showToast('접근 권한이 없습니다…','danger')` 후 중단
2. 모든 `.panel`에서 `.on` 제거 → `#p-<id>`에 `.on` 부여(표시)
3. 사이드바 활성 표시(`.ni.on`) 갱신, 상단 타이틀(`#ptitle`)을 `TITLES[id]`로 변경
4. 페이지별 지연 렌더 트리거: `dash→renderDashStats`, `acc-ledger→renderAlg`, `ledger→renderBal`, `calendar→renderCal`, `contract→renderContractUnified`

### 2.2 서브탭 전환 `stab(ns, id, el)` (index.html:1780)
- 네임스페이스(`ns`) 접두 패널 그룹에서 `#<ns>-<id>`만 활성화
- 탭 네임스페이스별 자동 동기화 렌더:
  - `ct-*`(계약·미수금): `by-contract/by-client/billing/unified` 하위 재렌더
  - `ev-*`(환경질): datalist 동기화 + 관리번호 기준 탭 동기화(`syncEnvMnoSelects`, `syncEnvTabsByMno`)
  - `lv-gen`(연차생성): `renderLvGen`

### 2.3 모달 `openMo(id)` / `closeMo(id)` (index.html:1777)
- `.mo-overlay` 배경 클릭 시 자동 닫힘. 총 **38개 모달**(`mo-*`) 사용.

### 2.4 패널 · 모달 인벤토리
- **최상위 패널(`p-*`) 16개**: `dash, member-info, notice, approval, calendar, worklog, emp, leavegen, leave, contract, env, client-reg, account, acc-ledger, ledger, equip`
  - 사이드바 미노출 내부 화면: `env-form`(환경 성적서 폼), `ledger-det`(거래처원장 상세)
- **모달(`mo-*`) 38개**: `mo-account-add, mo-appr-new, mo-appr-v, mo-billing, mo-cal, mo-calib-input, mo-client-add, mo-client-search, mo-contract, mo-decision-reason, mo-emp-detail, mo-emp-edit, mo-emp-reg, mo-emp-v, mo-env, mo-env-search-all, mo-eq-status, mo-equip-reg, mo-equip-v, mo-hr-order, mo-incident, mo-leave-req, mo-lv-adj, mo-memo-log, mo-my-annual, mo-my-info, mo-notice, mo-notice-v, mo-payment, mo-repair-input, mo-transfer, mo-travel, mo-trip, mo-up-account, mo-up-client, mo-up-ledger, mo-vehicle, mo-worklog`

---

## 3. 인증 · 회원 · 권한 모델

### 3.1 로그인 `doLogin()` (index.html:4994)
- 입력 아이디에 `@`가 없으면 `@unienv4u.com` 자동 부착
- `uni_members`에서 `email + pw` 일치 검색
- 상태 분기: `pending`(승인 대기) / `rejected`(거절) 거부, `approved`만 진입
- 성공 시 `currentUser` 설정, 사이드바 사용자 정보/권한 메뉴 렌더(`renderSidebarPerms`), 승인대기 배지 갱신
- ⚠️ **평문 비밀번호 비교** (해싱 없음). 서버 이관 시 반드시 해시+세션 도입 필요.

### 3.2 회원가입 `doSignup()` (index.html:5054)
- 필수: 이름/부서/직급/연락처/이메일/비밀번호(×2). 비밀번호 **8자 이상**, 확인 일치, 이메일 중복 불가
- 주민번호는 `btoa()` **단순 인코딩**(암호화 아님 — Base64). ⚠️ 보안상 서버 이관 시 교체 필수
- 신규 회원 `status:'pending'`, `reqNo:'REQ-'+Date.now()` 부여 → 마스터 승인 대기

### 3.3 회원 데이터 모델 (`uni_members` 배열 요소)
```
{
  email, pw, name, ename(영문), pemail(개인이메일), jumin(Base64 주민번호),
  dept(부서), rank(직급), type(정규직/계약직), tel, date(입사일),
  annualLeave(연차수), leaveDate(퇴사일), empno(사번),
  isAdmin(최고관리자), isMaster(마스터), isSubMaster(부마스터, 선택),
  status(pending|approved|rejected), reqNo, reqDate
}
```
- 초기 시드 `INIT_MEMBERS` 12명(EMP-000~011). 최초 1회 `admin@unienv4u.com` 미존재 시 주입, 이후 유지.
- **실제 시드 데모 계정** (README의 `demo@unienv4u.com`과 상이하니 주의):

| 구분 | 이메일 | 비밀번호 | 권한/부서 |
|------|--------|----------|-----------|
| 최고관리자/마스터 | `admin@unienv4u.com` | `admin1234` | 신창국·대표이사·경영지원팀 |
| 부마스터 | `choi@unienv4u.com` | `choi12345` | 최병효·이사·측정조사팀 |
| 일반(홍길동) | `hong@unienv4u.com` | `hong1234` | 대리·측정조사팀 |
| 승인대기 예시 | `new@unienv4u.com` | `new12345` | status=pending |

### 3.4 권한 체계

세 계층으로 접근을 통제한다.

1. **최고관리자/마스터** (`isAdmin || isMaster`): `canAccess`에서 무조건 통과(전 메뉴).
2. **부마스터** (`isSubMaster`): 지정 메뉴에 한해 마스터급 권한.
3. **부서별 메뉴 권한** `MENU_PERMS` (index.html:1708): 메뉴ID→허용부서 배열. **빈 배열 = 전 직원 접근**.

```
canAccess(menuId):
  currentUser 없음 → false
  isMaster||isAdmin → true
  그 외 → deptCanAccess(MENU_PERMS[menuId], currentUser.dept)
```

**부서 목록** `ALL_DEPTS = ['측정조사팀','실험실','소음진동팀','경영지원팀','대표']`
**부서 정규화** `DEPT_ALIASES`: `환경조사팀→측정조사팀`, `실험분석팀→실험실` (`normalizeDept`, 최초 로드 시 `migrateMemberDepts`가 마이그레이션)

**메뉴별 접근 권한 매트릭스** (`MENU_PERMS`, `_master`=마스터 전용 토큰):

| 메뉴 | 접근 허용 |
|------|-----------|
| `dash, notice, approval, calendar, worklog` | 전 직원 (빈 배열) |
| `emp, leavegen, leave` (인사·근태) | 경영지원팀·대표·마스터 |
| `contract, env` (사업관리) | 측정조사팀·소음진동팀·경영지원팀·대표·마스터 |
| `client-reg, account, acc-ledger, ledger, ledger-bal, ledger-det` (수금) | 경영지원팀·대표·마스터 |
| `equip` (장비) | 측정조사팀·실험실·소음진동팀·경영지원팀·대표·마스터 |
| `member-info` (회원관리) | 마스터 전용 |

- 사이드바는 `renderSidebarPerms(user)`가 접근 가능 메뉴만 노출.
- 권한 설정 UI(`renderPermSettings`, `savePermSettings`): 마스터가 매트릭스 편집 → `uni_menu_perms`에 영속.
- ⚠️ **기본값 리스크**: `uni_menu_perms`가 저장돼 있으면 코드의 `MENU_PERMS` 기본값을 덮어씀. 마스터 계정 잠금 방지 위해 배포 전 확인 필요.

---

## 4. 데이터 저장 구조 (`localStorage`)

모든 상태는 브라우저에 JSON 문자열로 저장된다. 서버 없음.

| 키 | 도메인 | 주요 스키마 요소 |
|----|--------|------------------|
| `uni_members` | 회원/사원 | §3.3 모델 |
| `uni_menu_perms` | 메뉴 접근 권한 | `{menuId: [부서...]}` |
| `uni_clients` | 거래처 | 코드/상호/사업자번호/대표/연락처 등 |
| `uni_ctu` | 통합 계약(공동계약·회차·출장) | 계약번호/발주처/금액/납부회차/공동참여 |
| `uni_billing` | 청구·수금 내역 | 계약번호/청구액/수금액/일자 |
| `uni_env` | 환경측정 성적서 | 관리번호(mno)/연도/발주처코드/측정항목/금액 |
| `uni_det_mno` | 원장↔관리번호 override | 매핑 |
| `uni_hr_orders` | 인사발령 | 사번/발령유형/일자/내용 |
| `uni_incidents` | 장비 이상 보고서 | 보고서번호/장비/증상/조치 |
| `uni_leaves` | 휴가 신청/결재 | 사번/유형/기간/일수/상태 |
| `uni_annual` | 연차 부여/사용 DB | 연도별 총·사용·잔여 |
| `uni_lv_settings` | 휴가 부여 규칙 설정 | 부여 규칙/차감 정책 |
| `uni_memos` | 항목별 메모 로그 | `memoKey` 기준 메모 배열 |

> 데이터 이전 로직 없음. 신규 사용자는 시드/빈 데이터로 시작하며 브라우저 캐시 삭제 시 초기화된다.

---

## 5. 기능 모듈 명세

각 모듈은 패널(`p-*`)·모달(`mo-*`)·함수군·저장 키로 구성된다. 함수는 index.html 내 정의.

### 5.1 대시보드 (`dash`)
- 통계/게시글 요약. 함수: `renderDashStats`, `openDashPost`.

### 5.2 공지사항/게시판 (`notice`)
- 공지·자유게시판 CRUD (모달 `mo-notice`, `mo-notice-v`).

### 5.3 전자결재 (`approval`)
- 기안→팀장→대표 승인 라인. 승인/반려 사유 처리.
- 함수: `processApprDecision`, `askDecisionReason`, `confirmDecisionReason`, `appLv`, `rejLv` (모달 `mo-appr-new`, `mo-appr-v`, `mo-decision-reason`).

### 5.4 일정/캘린더 (`calendar`)
- 월간 캘린더. 월 이동 `chM(d)`(±월, 연도 롤오버), 렌더 `renderCal`, 등록 모달 `mo-cal`.

### 5.5 업무일지 (`worklog`)
- 일지 CRUD (모달 `mo-worklog`).

### 5.6 인사관리 (`emp`)
- 사원 목록/편집, **인사발령** 등록·수정·필터, **인사기록카드** 인쇄.
- 함수: `renderEmpTable`, `filterEmpTable`, `openEmpDetail`, `openEmpEdit`, `saveEmpEdit`, `regEmpDirect`, `addEmpRow`; 발령 `openNewHrOrder`, `saveHrOrder`, `editHrOrder`, `renderHrOrder`, `filterHrOrder`, `openTransfer`, `saveTransfer`; 기록카드 `renderHrProfile`, `printHrProfile`.
- 저장: `uni_members`, `uni_hr_orders`. 모달: `mo-emp-*`, `mo-hr-order`, `mo-transfer`.

### 5.7 연차생성 (`leavegen`) · 휴가관리 (`leave`)
- **연차 자동 계산** (근로기준법, `calcAnnualLeave`, index.html):
  - 1년 미만 → 11일(월 1일 최대), 1~3년 → 15, 3~5년 → 16, 5~10년 → 17, 10~20년 → 21, 20년↑ → 25
  - 근속연수 = `floor((해당연 1/1 − 입사일)/365.25일)`
- 휴가 신청/결재: `openLeaveReq`, `submitLeaveReq`, `appLv`, `rejLv`.
- 연차 DB/집계: `getAnnualDB`, `setAnnualDB`, `initAnnualForYear`, `getAnnualSummary`(total/used/remain/useRate), `renderAnnualTab`, `renderMyAnnual`(`mo-my-annual`), `renderRemainByYear`.
- **이월(롤오버)**: `runYearRollover`, `runLvGenRollover`.
- 설정/차감: `renderLvSettings`, `saveLvSettings`, `getLvDeduct`, `updateLrDeduct`, `updLvBc`, `calcPayUnpaid`; 조정 모달 `mo-lv-adj`.
- 전체내역 필터 `filterLvAll`. 저장: `uni_leaves`, `uni_annual`, `uni_lv_settings`.

### 5.8 계약·미수금관리 (`contract`)
- 통합 계약(`renderContractUnified`, `filterContractUnified`, `syncCtuTabs`).
- **공동계약**: `toggleJointContract`, `addJointRow`, `calcJointRow`, `calcJointTotal`, `syncJointFromClient`, `syncJointPayTabs`.
- 납부회차/출장/납입 행: `addPayRow`, `addRoundRow`, `addTravRow`, `selectPayTab`.
- 청구/수금: `openNewBilling`, `saveBilling`, `renderBillingList`, `filterBillingList`, `initBillCtnoSelect`, `fillBillClient`.
- **미수금·대손**: `renderUnpaidByClient`, `renderUnpaidByContract`, `filterUnpaidByClient`, `filterUnpaidByContract`, `renderBadDebt`.
- 저장: `uni_ctu`, `uni_billing`. 모달: `mo-contract`, `mo-billing`, `mo-payment`, `mo-travel`, `mo-trip`.

### 5.9 환경질현황 / 환경 성적서 (`env`, `env-form`)
- 성적서 작성/조회/수정/인쇄/잠금: `newEnvForm`, `saveEnvForm`, `saveNewEnv`, `viewEnvForm`, `editEnvForm`, `printEnvForm`, `lockEnvForm`, `loadEnvToForm`, `resetEnvForm`.
- **관리번호 자동생성** `genManageNo`: `연도-발주처코드-순번(3자리)`. 코드 없으면 상호 앞 3자, 순번은 동일 코드·연도 기존 건수+1.
- 검색/동기화: `searchEnvByMno`, `searchEnvByField`, `searchPrevEnv`, `syncEnvMnoSelects`, `syncEnvTabsByMno`, `filterEnvMnoList`, `showEnvAllModal`, `filterEnvModalRows`.
- 탭 렌더: `renderEnvList`, `renderEnvContractTab`, `renderEnvPayTab`, `renderEnvTripTab`; 출장 `openEnvTripForm`, `saveTripRecord`.
- 금액 계산: `calcEnvAmt`, `calcChgAmt`. 권한: `canEditEnv`, `canApproveEnv`.
- 초기 시드 `INIT_ENV`(최초 1회 `initEnvData`). 저장: `uni_env`, `uni_det_mno`. 모달: `mo-env`, `mo-env-search-all`.

### 5.10 거래처등록 (`client-reg`)
- 등록/수정/검색/필터: `saveClient`, `editClient`, `renderClientList`, `renderClientTable`, `renderClientSearch`, `openClientSearch`, `selectClient`, `filterClientList`, `syncClientSelects`.
- **엑셀 템플릿·일괄 업로드**: `downloadClientTemplate`, `uploadClientFile`.
- 저장: `uni_clients`. 모달: `mo-client-add`, `mo-client-search`, `mo-up-client`.

### 5.11 계정과목 (`account`)
- 계정과목 CRUD. 모달 `mo-account-add`, 업로드 `mo-up-account`.

### 5.12 계정별원장 (`acc-ledger`)
- `renderAlg`, D3 연도 자동추출 `extractYear`, `previewD3`. 업로드 `ledgerUp`, `ledgerDoUp`, `mo-up-ledger`.

### 5.13 거래처원장 (`ledger`) · 상세 (`ledger-det`)
- 잔액/내용 탭: `renderBal`, `renderDet`.
- 상세↔환경 관리번호 연동: `linkDetToEnv`, `applyDetManageNo`, `genManageNo`.

### 5.14 장비관리 (`equip`)
- **장비 이상 보고서**: `openNewIncident`, `saveIncidentReport`, `editIncident`, `renderIncidentList`, `filterIncidentList`, `printIncidentReport`(별창 인쇄).
- 상태 관리: `openEqStatus`, `saveEqStatus`; 수리/교정 이력 이동 `jumpRepair`, `jumpCalib`, `saveRepair`, `saveCalib`, `confirmSign`.
- 저장: `uni_incidents`. 모달: `mo-incident`, `mo-eq-status`, `mo-equip-reg`, `mo-equip-v`, `mo-repair-input`, `mo-calib-input`.

### 5.15 회원정보 관리 (`member-info`, 마스터 전용)
- 가입 승인/거절: `approveMember`, `rejectMember`, `renderPendingList`, `updatePendingBadge`.
- 마스터/부마스터 토글: `toggleMaster`, `toggleSubMaster`, `toggleMasterQuick`.
- 권한 매트릭스: `renderPermSettings`, `renderSidebarPerms`, `savePermSettings`.
- **초대 링크**: `renderInvite`, `copyInviteLink`.

### 5.16 공통 · 유틸
- 메모 로그: `openMemoLog`, `openMemoLogFromDet`, `addMemoEntry`, `deleteMemoEntry`, `renderMemoList`, `getMemos`, `memoKey`, `memoCountBadge` (`uni_memos`, `mo-memo-log`).
- 내 정보: `openMyInfo`, `saveMyInfo` (`mo-my-info`).
- 파일 업로드 공통: `simpleUp`, `simpleDoUp`.
- DOM 헬퍼: `setT`, `setTxt`, `sV`, `sp`(short setter), `row`, `calcT`, `buildDate`.
- 기타: `showToast`(토스트), `goHome`, `clearMobileSb`, `buildMobileSb`(모바일 사이드바), `updatePendingBadge`.

---

## 6. UI / 스타일 시스템

- **디자인 토큰(CSS 변수)**: 색상 `--bg-*`(primary/secondary/tertiary/info/success/warning/danger), `--text-*`, `--border-*`, `--accent`/`--accent-dark`, 반경 `--radius-md`/`--radius-lg`.
- **다크 모드**: `@media(prefers-color-scheme:dark)`로 변수 재정의(자동 전환).
- **반응형**: `@media(max-width:768px)` 태블릿, `@media(max-width:480px)` 모바일. 모바일 전용 사이드바(`buildMobileSb`/`clearMobileSb`) 및 하단 퀵아이콘 바(`.fv-*`).
- **인쇄**: `@media print`로 버튼 숨김. 성적서/이상보고서/인사기록카드는 `window.open`+`window.onload=window.print()`.
- **컴포넌트 클래스**: `.panel/.on`(페이지), `.tab-row/.tab`(탭), `.ni`(사이드바 항목), `.mo-overlay`(모달), `.bx`(배지: `ba`검토중/`bg`완료/`bt`월차/`bb`연차/`br`반려/`bgr`중립 등), `.btn`(pri/dng/sm), `.ava`(아바타).

---

## 7. 재개발 시 고려사항 (서버 이관 관점)

| 항목 | 현재(v0.9.33) | 재개발 권고 |
|------|---------------|-------------|
| 저장소 | localStorage 11키 | RDB(테이블 11+) / REST·GraphQL API |
| 인증 | 평문 pw 비교, 클라이언트 세션 | 비밀번호 해시(bcrypt 등)+JWT/세션, HTTPS |
| 주민번호 | `btoa()` Base64 | 서버측 암호화(AES)·마스킹·접근통제 |
| 권한 | 클라이언트 `canAccess` | 서버측 인가(RBAC) 이중화 — 클라 UI는 표시용만 |
| 코드 구조 | 단일 파일 183함수 전역 | 모듈 분리(도메인별), 상태관리 계층 |
| 동시성/무결성 | 단일 브라우저, 없음 | 트랜잭션·낙관적 잠금(성적서 `lockEnvForm` 대응) |
| ID 생성 | `Date.now()` 접두 | 서버 시퀀스/UUID |
| 파일 업로드 | 클라 파싱만 | 서버 저장·검증 |

### 7.1 기능 → 데이터 → 권한 추적 매트릭스(요약)

| 기능 모듈 | 패널 | 저장 키 | 접근 부서 |
|-----------|------|---------|-----------|
| 인사/발령 | emp | uni_members, uni_hr_orders | 경영지원·대표·마스터 |
| 휴가/연차 | leave, leavegen | uni_leaves, uni_annual, uni_lv_settings | 경영지원·대표·마스터 |
| 계약/미수금 | contract | uni_ctu, uni_billing | 측정·소음·경영지원·대표·마스터 |
| 환경 성적서 | env, env-form | uni_env, uni_det_mno | 측정·소음·경영지원·대표·마스터 |
| 거래처/원장 | client-reg, ledger, account, acc-ledger | uni_clients | 경영지원·대표·마스터 |
| 장비 | equip | uni_incidents | 측정·실험·소음·경영지원·대표·마스터 |
| 회원/권한 | member-info | uni_members, uni_menu_perms | 마스터 전용 |
| 메모 | (공통) | uni_memos | 전체 |

---

## 8. 알려진 리스크 · 확인 필요 사항

1. **데모 계정 문서 불일치**: README는 `demo@unienv4u.com`이나 실제 시드는 `hong@unienv4u.com`. 문서/코드 통일 필요.
2. **권한 기본값 잠금**: `uni_menu_perms` 저장값이 코드 기본을 덮으므로 마스터가 자신을 잠글 여지. 배포 전 점검.
3. **보안**: 평문 비밀번호·Base64 주민번호·클라이언트 단독 인가 → 실운영 부적합. 서버화 필수.
4. **데이터 휘발성**: 브라우저 캐시 삭제 시 전 데이터 소실. 백업/이관 경로 없음.
5. **전역 네임스페이스 충돌**: 183개 함수가 단일 스코프. 확장 시 명명 충돌·사이드이펙트 주의.
6. **CHANGELOG 공백**: v0.9.x 이력이 `CHANGELOG.md`에 미반영. 본 스펙과 `spec_20260714.md`가 기준 문서.

---

*본 문서는 `docs/unienv4u_groupware_v0.9.33.html` 정적 분석(2026-07-14 기준)으로 작성되었습니다. 함수·줄번호는 해당 스냅샷 기준입니다.*
