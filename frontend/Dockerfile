# 1. 베이스 이미지 설정 (Node.js 20)
FROM node:20-alpine

# 2. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. package.json과 package-lock.json 복사
COPY package*.json ./

# 4. 의존성 설치
RUN npm install

# 5. 소스 코드 복사
COPY . .

# 6. Vite 개발 서버 실행 (컨테이너 외부에서 접근 가능하도록 --host 옵션 추가)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
