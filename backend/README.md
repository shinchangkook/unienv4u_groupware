# 백엔드 (2단계 — 미구현)

1단계 MVP는 프론트엔드의 **mock API 계층**(`frontend/src/mock/api.ts`)으로 동작한다.
백엔드는 아래 REST 계약을 그대로 구현하여 mock을 실제 HTTP로 교체하는 것을 목표로 한다.

## 권장 스택 (2단계 결정 예정)
- 런타임: Node.js + Express (또는 NestJS)
- DB: PostgreSQL (스펙 §4의 11개 도메인 → 정규화 테이블)
- 인증: 비밀번호 해시(bcrypt) + JWT/세션 — spec §7 보안 권고
- 인가: 서버측 RBAC 이중화 (프론트 `canAccess`는 표시용)

## REST 계약 (mock과 1:1 대응)

| 메서드 | 엔드포인트 | 설명 | mock 대응 |
|--------|-----------|------|-----------|
| POST | `/api/auth/login` | 로그인 → 사용자+토큰 | `api.login` |
| GET | `/api/members` | 회원 목록 | `api.listMembers` |
| GET | `/api/members?status=pending` | 가입 대기 | `api.listPending` |
| GET | `/api/notices` | 공지/게시판 | `api.listNotices` |
| GET | `/api/approvals` | 전자결재 | `api.listApprovals` |
| GET | `/api/events` | 일정 | `api.listEvents` |
| GET | `/api/worklogs` | 업무일지 | `api.listWorklogs` |
| GET | `/api/hr-orders` | 인사발령 | `api.listHrOrders` |
| GET | `/api/leaves` | 휴가 | `api.listLeaves` |
| GET | `/api/leaves/annual?empno=&year=` | 연차 집계 | `api.annualSummary` |
| GET | `/api/contracts` | 계약 | `api.listContracts` |
| GET | `/api/billings` | 청구/수금 | `api.listBillings` |
| GET | `/api/env-reports` | 환경 성적서 | `api.listEnvReports` |
| GET | `/api/clients` | 거래처 | `api.listClients` |
| GET | `/api/incidents` | 장비 이상보고 | `api.listIncidents` |
| GET | `/api/equipment` | 장비 대장 | `api.listEquipment` |

> 데이터 스키마는 `frontend/src/types/index.ts`를 서버 DTO의 기준으로 사용한다.
> 프론트 교체 지점: `frontend/src/mock/api.ts` 의 각 메서드를 `fetch('/api/...')` 로 대체.
