# unienv4u 그룹웨어 — 단일 컨테이너(백엔드가 프론트 정적 파일도 서빙)
FROM node:22-alpine

WORKDIR /app

# 의존성 먼저(캐시 활용)
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# 앱 소스 + 프론트엔드
COPY server ./server
COPY index.html ./index.html
COPY js ./js
COPY assets ./assets

WORKDIR /app/server

# 데이터(SQLite/업로드)는 볼륨으로 유지
VOLUME ["/app/server/data"]

ENV PORT=4000
EXPOSE 4000

# 운영 시 docker run -e JWT_SECRET=... -e JUMIN_KEY=... 로 비밀 주입
CMD ["node", "src/index.js"]
