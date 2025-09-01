# 그루미 백엔드 서버

Node.js + Express + PostgreSQL을 사용한 그루미 앱 백엔드 API 서버

## 🚀 시작하기

### 1. 환경 설정

```bash
cd server
npm install
```

### 2. 환경 변수 설정

`env.example`을 복사하여 `.env` 파일을 생성하고 실제 값으로 수정:

```bash
cp env.example .env
```

`.env` 파일 예시:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=groume_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:19006
```

### 3. PostgreSQL 데이터베이스 설정

1. PostgreSQL 설치 및 실행
2. 데이터베이스 생성: `CREATE DATABASE groume_db;`
3. 루트 디렉토리의 `database_schema.sql` 실행:
   ```bash
   psql -U postgres -d groume_db -f ../database_schema.sql
   ```

### 4. 서버 실행

```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

## 📡 API 엔드포인트

### 인증 (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | 회원가입 |
| POST | `/login` | 로그인 |
| POST | `/logout` | 로그아웃 |
| GET | `/verify` | 토큰 검증 |

### 사용자 (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | 프로필 조회 | ✅ |
| PUT | `/profile` | 프로필 업데이트 | ✅ |
| GET | `/tickets` | 티켓 조회 | ✅ |
| GET | `/missions` | 미션 조회 | ✅ |

### 기타

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | 서버 상태 확인 |

## 🧪 API 테스트

### 회원가입 테스트
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "name": "테스트유저",
    "age": 25,
    "gender": "male",
    "region": "서울"
  }'
```

### 로그인 테스트
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!"
  }'
```

### 프로필 조회 테스트
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 보안 기능

- **bcryptjs**: 비밀번호 해싱
- **JWT**: 토큰 기반 인증
- **Helmet**: 보안 헤더 설정
- **CORS**: Cross-Origin 요청 제어
- **Rate Limiting**: API 호출 제한
- **Input Validation**: 입력 데이터 검증

## 📝 개발 노트

### React Native 앱 연동

React Native 앱에서 서버 API를 호출할 때:

1. **로컬 개발**: `http://localhost:3000`
2. **안드로이드 에뮬레이터**: `http://10.0.2.2:3000`
3. **iOS 시뮬레이터**: `http://localhost:3000`
4. **실제 디바이스**: 컴퓨터의 실제 IP 주소 사용

### 에러 응답 형식

```json
{
  "success": false,
  "message": "에러 메시지",
  "errors": [/* 유효성 검증 에러 배열 */]
}
```

### 성공 응답 형식

```json
{
  "success": true,
  "message": "성공 메시지",
  "user": {/* 사용자 데이터 */},
  "token": "JWT_TOKEN"
}
```

## 🏠 홈서버 배포 준비

나중에 홈서버로 옮길 때 필요한 사항:

1. **PM2** 설치: `npm install -g pm2`
2. **환경 변수** 프로덕션 값으로 변경
3. **HTTPS** 설정 (Let's Encrypt)
4. **방화벽** 설정 (포트 3000 열기)
5. **도메인** 연결 (선택사항)

```bash
# PM2로 서버 실행
pm2 start server.js --name groume-api
pm2 save
pm2 startup
```
