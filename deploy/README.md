# 배포 가이드 (운영)

`uni_build_20260714.md` §8 배포/인프라의 실무 설정 모음입니다.

## 1. 컨테이너 실행
루트에서:
```bash
export JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
export JUMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
export CORS_ORIGIN=https://groupware.example.com
docker compose up -d --build
```
- 데이터(SQLite·업로드)는 `groupware-data` 볼륨에 영속.
- `JWT_SECRET`·`JUMIN_KEY` 는 반드시 강한 무작위 값으로 주입(오케스트레이터 시크릿 권장).

## 2. HTTPS 리버스 프록시
`deploy/nginx.conf.example` 을 `/etc/nginx/conf.d/groupware.conf` 로 복사, 도메인·인증서 경로 수정:
```bash
sudo certbot --nginx -d groupware.example.com   # 인증서 자동 발급
sudo nginx -t && sudo systemctl reload nginx
```

## 3. 스케줄 백업 (cron)
매일 새벽 3시 일관 스냅샷 + 30일 경과분 정리:
```cron
# crontab -e
0 3 * * * cd /path/to/unienv4u_groupware/server && /usr/bin/node scripts/backup.js >> data/backup.log 2>&1
30 3 * * * find /path/to/unienv4u_groupware/server/data/backups -name '*.db' -mtime +30 -delete
```
컨테이너 환경이면 호스트에서 `docker exec unienv4u-groupware node scripts/backup.js` 로 실행하고,
`data/backups`·`data/uploads` 를 오프사이트(별도 스토리지)로 복제 보관.

## 4. 운영 체크리스트 (uni_build §9)
- [ ] `JWT_SECRET`·`JUMIN_KEY` 무작위 값 주입, `.env` 커밋 금지
- [ ] HTTPS 강제 + 보안 헤더(nginx.conf 포함)
- [ ] `CORS_ORIGIN` 을 실제 도메인으로 제한
- [ ] 정기 백업 + 오프사이트 보관, 복구 리허설
- [ ] 마스터 계정 이중화(잠김 방지), 감사 로그 주기적 점검
- [ ] (규모 확대 시) SQLite → PostgreSQL 이전 검토
