# --- Build stage -----------------------------------------------------------
FROM node:20-bullseye AS builder
WORKDIR /app

# 1) 의존성만 먼저 복사 → npm ci (CI용이면 ci 추천)
COPY package*.json ./
RUN npm ci

# 2) 나머지 소스 복사
COPY tsconfig.json ./
COPY src ./src

# 없는 경우 에러 나니까, public / swagger 파일이 없으면 그냥 빈 폴더로라도 만들어두는 것도 가능
COPY public ./public
COPY swagger.js ./
COPY swagger-output.json ./

# swagger 출력이 빌드 전에 필요 없다면, 여기서 swagger 관련은 빼도 됨
RUN npm run build

# --- Runtime stage --------------------------------------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# 프로덕션 의존성만
COPY package*.json ./
RUN npm ci --omit=dev

# 빌드 결과 + 필요한 정적 파일만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/swagger-output.json ./

EXPOSE 8080
CMD ["node", "dist/server.js"]