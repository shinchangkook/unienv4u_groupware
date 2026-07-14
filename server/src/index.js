'use strict';
const path = require('node:path');
const express = require('express');
const cors = require('cors');
const cfg = require('./config');
const { seed } = require('./seed');
const domains = require('./domains');

// Phase 2 모델링 테이블 생성 + 최초 기동 시 회원 시드(비어 있을 때만).
domains.createTables();
seed();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cors({ origin: cfg.CORS_ORIGIN.length ? cfg.CORS_ORIGIN : true }));

// 헬스체크
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'unienv4u-groupware', time: new Date().toISOString() }));

// API 라우트
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/members', require('./routes/members.routes'));
app.use('/api/domains', require('./routes/domains.routes')); // Phase 2 모델링 도메인
app.use('/api/kv', require('./routes/kv.routes'));            // 객체형 도메인(det_mno·연차·설정·메모·권한)
app.use('/api/leave', require('./routes/leave.routes'));     // Phase 3 연차 계산(서버 권위)
app.use('/api/approvals', require('./routes/approvals.routes')); // Phase 4 전자결재
app.use('/api/files', require('./routes/files.routes'));     // Phase 4 첨부파일
app.use('/api/notifications', require('./routes/notifications.routes')); // Phase 5 알림
app.use('/api/data', require('./routes/data.routes'));       // 범용 블롭(leaves 등)

// 정적 프론트엔드 제공 (index.html, js/, assets/ ...)
if (cfg.SERVE_FRONTEND) {
  app.use(express.static(cfg.FRONTEND_DIR, { index: 'index.html', extensions: ['html'] }));
}

// 알 수 없는 API 경로
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found', message: '존재하지 않는 API 경로입니다.' }));

// 공통 에러 핸들러
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'server_error', message: '서버 오류가 발생했습니다.' });
});

app.listen(cfg.PORT, () => {
  console.log(`▶ unienv4u 그룹웨어 서버 실행: http://localhost:${cfg.PORT}`);
  console.log(`  - API:      http://localhost:${cfg.PORT}/api/health`);
  if (cfg.SERVE_FRONTEND) console.log(`  - 프론트:   http://localhost:${cfg.PORT}/  (index.html)`);
});
