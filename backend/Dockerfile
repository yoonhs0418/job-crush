# 1. 베이스 이미지 설정
FROM node:20-alpine

# 2. bcrypt 및 prisma 빌드에 필요한 라이브러리 설치
RUN apk add --no-cache python3 make g++ openssl

# 3. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 4. package.json과 package-lock.json 복사
COPY package*.json ./

# 5. 의존성 설치
RUN npm install

# 6. Prisma 스키마 복사 및 클라이언트 생성 (핵심 추가!)
COPY prisma ./prisma
RUN npx prisma generate

# 7. 소스 코드 복사
COPY . .

# 8. 애플리케이션 실행
CMD ["npm", "run", "start:dev"]