/*
 * uni-store.js — 데이터 접근 어댑터 (uni_build_20260714.md §6.1)
 *
 * 목적: index.html 의 localStorage 직접 접근을 한 곳으로 모아, 내부 구현만
 *       서버 API로 교체할 수 있게 한다. 서버(Node)로 서빙되면 실제 인증/DB를
 *       사용하고, 파일(file://)로 열면 기존 localStorage 동작으로 자동 폴백한다.
 */
(function (global) {
  'use strict';

  var API_BASE = (global.UNI_API_BASE !== undefined) ? global.UNI_API_BASE : '';
  var TOKEN_KEY = 'uni_token';
  var state = { online: false, checked: false };

  function token() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (token()) headers['Authorization'] = 'Bearer ' + token();
    if (opts.headers) for (var k in opts.headers) headers[k] = opts.headers[k];
    return fetch(API_BASE + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) { var err = new Error(data.message || ('HTTP ' + r.status)); err.status = r.status; err.data = data; throw err; }
        return data;
      });
    });
  }

  // 서버 가용성 확인 (한 번만). 실패하면 오프라인(localStorage) 모드.
  function checkOnline() {
    if (state.checked) return Promise.resolve(state.online);
    return fetch(API_BASE + '/api/health').then(function (r) {
      state.online = r.ok; state.checked = true; return state.online;
    }).catch(function () { state.checked = true; state.online = false; return false; });
  }

  // ── 로컬 폴백 유틸 ──
  function lsGet(key, def) { try { return JSON.parse(localStorage.getItem(key) || def); } catch (e) { return JSON.parse(def); } }
  function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  // ── 인증 ──
  var Auth = {
    isOnline: function () { return state.online; },
    ready: checkOnline,

    login: function (idRaw, pw) {
      var id = String(idRaw || '').trim();
      if (id && id.indexOf('@') === -1) id = id + '@unienv4u.com';
      return checkOnline().then(function (online) {
        if (online) {
          return api('/api/auth/login', { method: 'POST', body: { id: id, pw: pw } })
            .then(function (res) { setToken(res.token); return { ok: true, user: res.user, online: true }; })
            .catch(function (e) { return { ok: false, message: e.message, status: e.status, online: true }; });
        }
        // 오프라인 폴백: 기존 localStorage 로직
        var db = lsGet('uni_members', '[]');
        var user = db.find(function (m) { return m.email === id && m.pw === pw; });
        if (!user) return { ok: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.', online: false };
        if (user.status === 'pending') return { ok: false, message: '가입 승인 대기 중입니다.', online: false };
        if (user.status === 'rejected') return { ok: false, message: '가입이 거절되었습니다.', online: false };
        return { ok: true, user: user, online: false };
      });
    },

    signup: function (payload) {
      return checkOnline().then(function (online) {
        if (online) {
          return api('/api/auth/signup', { method: 'POST', body: payload })
            .then(function (res) { return { ok: true, message: res.message, online: true }; })
            .catch(function (e) { return { ok: false, message: e.message, status: e.status, online: true }; });
        }
        // 오프라인 폴백
        var db = lsGet('uni_members', '[]');
        if (db.find(function (m) { return m.email === payload.email; })) {
          return { ok: false, message: '이미 등록된 이메일입니다.', online: false };
        }
        db.push(Object.assign({}, payload, { status: 'pending', reqNo: 'REQ-' + Date.now() }));
        lsSet('uni_members', db);
        return { ok: true, message: '가입 신청이 접수되었습니다.', online: false };
      });
    },

    logout: function () {
      var t = token();
      setToken('');
      if (state.online && t) { api('/api/auth/logout', { method: 'POST' }).catch(function () {}); }
      return Promise.resolve();
    },

    // 서버 회원 목록을 localStorage(uni_members)에 미러링 → 기존 화면 호환.
    syncMembers: function () {
      if (!state.online) return Promise.resolve(lsGet('uni_members', '[]'));
      return api('/api/members').then(function (res) {
        lsSet('uni_members', res.members); return res.members;
      }).catch(function () { return lsGet('uni_members', '[]'); });
    },
    approveMember: function (email) { return api('/api/members/' + encodeURIComponent(email) + '/approve', { method: 'POST' }); },
    rejectMember: function (email) { return api('/api/members/' + encodeURIComponent(email) + '/reject', { method: 'POST' }); },
    updateMember: function (email, fields) { return api('/api/members/' + encodeURIComponent(email), { method: 'PATCH', body: fields }); },
  };

  // ── 범용 도메인 저장소 (Phase 2 에서 화면별로 점진 연결) ──
  var Store = {
    list: function (domain) {
      return checkOnline().then(function (online) {
        if (online) return api('/api/data/' + domain).then(function (r) { return r.items; });
        return lsGet('uni_' + domain, '[]');
      });
    },
    save: function (domain, arr) {
      lsSet('uni_' + domain, arr); // 로컬 캐시는 항상 유지
      return checkOnline().then(function (online) {
        if (online) return api('/api/data/' + domain, { method: 'PUT', body: arr }).then(function () { return true; });
        return true;
      });
    },
  };

  // ── Phase 2 도메인 동기화 (하이드레이트 + 쓰기 미러링) ──
  // 기존 화면 코드를 거의 건드리지 않고, localStorage 읽기/쓰기를 서버와 동기화한다.
  //  - 로그인 시: 서버 데이터를 로컬로 하이드레이트(서버 우선, 서버가 비면 로컬 최초 이관).
  //  - 쓰기 시:   대상 키의 localStorage.setItem 을 가로채 서버로 디바운스 반영.
  var MODELED = [
    // Phase 2 — 모델링 테이블(/api/domains)
    { key: 'uni_clients', domain: 'clients', type: 'array' },
    { key: 'uni_ctu', domain: 'contracts', type: 'array' },
    { key: 'uni_billing', domain: 'billings', type: 'array' },
    { key: 'uni_env', domain: 'env', type: 'array' },
    { key: 'uni_det_mno', kv: 'det_mno', type: 'object' },
    // Phase 3 — 인사/근태 객체형(/api/kv) + 휴가 블롭(/api/data)
    { key: 'uni_annual', kv: 'annual', type: 'object' },
    { key: 'uni_lv_settings', kv: 'lv_settings', type: 'object' },
    { key: 'uni_memos', kv: 'memos', type: 'object' },
    { key: 'uni_menu_perms', kv: 'menu_perms', type: 'object' },
    { key: 'uni_leaves', data: 'leaves', type: 'array' },
  ];
  var BY_KEY = {}; MODELED.forEach(function (e) { BY_KEY[e.key] = e; });

  var suppressMirror = false;   // 하이드레이트 중 미러링 방지
  var origSetItem = null;
  var timers = {};

  function writeLocal(key, str) {
    suppressMirror = true;
    try { localStorage.setItem(key, str); } finally { suppressMirror = false; }
  }
  function pushEntry(entry) {
    var raw; try { raw = localStorage.getItem(entry.key); } catch (e) { return Promise.resolve(); }
    if (raw == null) return Promise.resolve();
    var val; try { val = JSON.parse(raw); } catch (e) { return Promise.resolve(); }
    if (entry.kv) return api('/api/kv/' + entry.kv, { method: 'PUT', body: { value: val } }).catch(function () {});
    if (entry.data) return api('/api/data/' + entry.data, { method: 'PUT', body: val }).catch(function () {});
    return api('/api/domains/' + entry.domain, { method: 'PUT', body: val }).catch(function () {});
  }
  function entryUrl(entry) {
    if (entry.kv) return '/api/kv/' + entry.kv;
    if (entry.data) return '/api/data/' + entry.data;
    return '/api/domains/' + entry.domain;
  }
  function schedulePush(entry) {
    if (timers[entry.key]) clearTimeout(timers[entry.key]);
    timers[entry.key] = setTimeout(function () { timers[entry.key] = null; pushEntry(entry); }, 400);
  }
  function hasData(entry, val) {
    if (entry.kv) return val && typeof val === 'object' && Object.keys(val).length > 0;
    return Array.isArray(val) && val.length > 0;
  }

  var Sync = {
    // localStorage.setItem 후크 설치(1회). 온라인이고 대상 키일 때만 서버로 미러링.
    install: function () {
      if (origSetItem) return;
      try { origSetItem = localStorage.setItem.bind(localStorage); } catch (e) { return; }
      var self = this;
      localStorage.setItem = function (k, v) {
        origSetItem(k, v);
        if (!suppressMirror && state.online && BY_KEY[k]) schedulePush(BY_KEY[k]);
      };
    },
    // 서버 → 로컬 하이드레이트. 서버가 비어 있으면 로컬 데이터를 서버로 최초 이관.
    hydrate: function () {
      return checkOnline().then(function (online) {
        if (!online) return false;
        return Promise.all(MODELED.map(function (entry) {
          return api(entryUrl(entry)).then(function (res) {
            var serverVal = entry.kv ? res.value : res.items;
            if (hasData(entry, serverVal)) {
              writeLocal(entry.key, JSON.stringify(serverVal));   // 서버 우선
            } else {
              var localVal = null;
              try { localVal = JSON.parse(localStorage.getItem(entry.key) || 'null'); } catch (e) {}
              if (hasData(entry, localVal)) return pushEntry(entry); // 최초 이관
            }
          }).catch(function () {});
        })).then(function () { return true; });
      });
    },
    // 하이드레이트 후 현재 화면 갱신(각 render 는 localStorage 를 다시 읽음).
    refresh: function () {
      ['syncClientSelects', 'renderClientList', 'renderContractUnified', 'renderBillingList',
        'renderEnvList', 'renderBal', 'renderAlg', 'renderDashStats', 'renderUnpaidByClient',
        // Phase 3 — 인사/근태 화면 (인자 없이 localStorage 재조회하는 것만)
        'renderAnnualTab', 'renderMyAnnual', 'renderLvSettings', 'filterLvAll', 'renderLvGen']
        .forEach(function (fn) { try { if (typeof global[fn] === 'function') global[fn](); } catch (e) {} });
    },

    // 서버 권위 연차계산 (근로기준법). 실패 시 null.
    calcAnnual: function (hireDate, year) {
      if (!state.online) return Promise.resolve(null);
      return api('/api/leave/calc-annual', { method: 'POST', body: { hireDate: hireDate, year: year } })
        .then(function (r) { return r.generated; }).catch(function () { return null; });
    },
    annualSummary: function (email, fromYear, toYear) {
      if (!state.online) return Promise.resolve(null);
      return api('/api/leave/summary', { method: 'POST', body: { email: email, fromYear: fromYear, toYear: toYear } })
        .then(function (r) { return r.years; }).catch(function () { return null; });
    },
  };

  // ── Phase 4 — 전자결재 / 첨부파일 / 민감정보 헬퍼 ──
  var Approval = {
    list: function (box) { return api('/api/approvals?box=' + (box || 'all')); },
    get: function (id) { return api('/api/approvals/' + encodeURIComponent(id)); },
    // 기안: { title, type, content, approvers:[email,...] }
    create: function (payload) { return api('/api/approvals', { method: 'POST', body: payload }); },
    approve: function (id, reason) { return api('/api/approvals/' + encodeURIComponent(id) + '/approve', { method: 'POST', body: { reason: reason || '' } }); },
    reject: function (id, reason) { return api('/api/approvals/' + encodeURIComponent(id) + '/reject', { method: 'POST', body: { reason: reason || '' } }); },
  };

  var Files = {
    list: function (domain, targetId) {
      return api('/api/files?domain=' + encodeURIComponent(domain || '') + '&targetId=' + encodeURIComponent(targetId || ''))
        .then(function (r) { return r.items; });
    },
    // File 객체 업로드(브라우저)
    upload: function (file, domain, targetId) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          var b64 = String(reader.result).split(',')[1] || '';
          api('/api/files', { method: 'POST', body: { domain: domain || '', targetId: targetId || '', filename: file.name, mime: file.type, dataB64: b64 } })
            .then(resolve, reject);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    downloadUrl: function (id) { return API_BASE + '/api/files/' + encodeURIComponent(id); },
    remove: function (id) { return api('/api/files/' + encodeURIComponent(id), { method: 'DELETE' }); },
  };

  var Member = {
    setJumin: function (email, jumin) { return api('/api/members/' + encodeURIComponent(email) + '/jumin', { method: 'PUT', body: { jumin: jumin } }); },
    getJumin: function (email) { return api('/api/members/' + encodeURIComponent(email) + '/jumin'); },
  };

  // 인앱 알림 (Phase 5)
  var Notify = {
    list: function (unreadOnly) { return api('/api/notifications' + (unreadOnly ? '?unread=1' : '')); },
    count: function () { return api('/api/notifications/count').then(function (r) { return r.unread; }); },
    read: function (id) { return api('/api/notifications/' + id + '/read', { method: 'POST' }); },
    readAll: function () { return api('/api/notifications/read-all', { method: 'POST' }); },
  };

  global.UniAuth = Auth;
  global.UniStore = Store;
  global.UniSync = Sync;
  global.UniApproval = Approval;
  global.UniFiles = Files;
  global.UniMember = Member;
  global.UniNotify = Notify;
  Sync.install();   // 로드 즉시 후크 설치(오프라인이면 미러링 자동 무시)
})(window);
