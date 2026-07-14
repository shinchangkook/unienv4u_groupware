'use strict';
// Phase 3 — 연차 자동계산 로직을 서버로 이관(신뢰 필요한 계산의 단일 기준).
// index.html 의 calcAnnualLeave / initAnnualForYear 와 동일한 근로기준법 티어를 서버에서 권위 있게 계산한다.

// 입사일·기준연도로 근속연수 → 연차 생성일수.
function calcAnnualLeave(hireDate, year) {
  const hire = new Date(hireDate || Date.now());
  const ref = new Date(String(year) + '-01-01');
  const yrs = Math.max(0, Math.floor((ref - hire) / (365.25 * 24 * 3600 * 1000)));
  if (Number.isNaN(yrs)) return 11;
  if (yrs < 1) return 11;   // 1년 미만: 월 1일(최대 11일)
  if (yrs < 3) return 15;
  if (yrs < 5) return 16;
  if (yrs < 10) return 17;
  if (yrs < 20) return 21;
  return 25;
}

// 해당 연도 연차 데이터 산출(생성 + 전년도 이월, 최대 10일 이월).
// prev = 전년도 {generated, carried, used} (없으면 null).
function initAnnualForYear(hireDate, year, prev) {
  const generated = calcAnnualLeave(hireDate, year);
  let carried = 0;
  if (prev) {
    carried = Math.min(10, Math.max(0, (Number(prev.generated) || 0) + (Number(prev.carried) || 0) - (Number(prev.used) || 0)));
  }
  return { year: Number(year), generated, carried, used: (prev && prev.usedThisYear) || 0 };
}

module.exports = { calcAnnualLeave, initAnnualForYear };
