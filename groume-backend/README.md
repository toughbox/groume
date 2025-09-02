# 🎉 그루미(Groume) 백엔드 API 서버

그루미 앱의 백엔드 API 서버입니다. **트리거 대신 백엔드에서 모든 비즈니스 로직을 처리**하여 더 나은 관리성과 확장성을 제공합니다.

## 🏗️ **주요 특징**

### ✅ **트리거 제거 및 백엔드 로직 구현**
- ❌ **기존**: 데이터베이스 트리거로 평점/티켓 자동 업데이트
- ✅ **개선**: Express.js 서비스에서 트랜잭션으로 안전하게 처리

### 🔧 **기술 스택**
- **런타임**: Node.js 18+
- **프레임워크**: Express.js 4.18+
- **데이터베이스**: PostgreSQL (groume 스키마)
- **인증**: JWT + bcrypt
- **검증**: Joi
- **로깅**: Winston

## 📁 **프로젝트 구조**

```
groume-backend/
├── src/
│   ├── config/
│   │   └── database.js         # DB 연결 및 트랜잭션 헬퍼
│   ├── controllers/
│   │   ├── authController.js   # 인증 컨트롤러
│   │   ├── reviewController.js # 리뷰 컨트롤러
│   │   └── ticketController.js # 티켓 컨트롤러
│   ├── services/
│   │   ├── UserService.js      # 사용자 비즈니스 로직
│   │   ├── ReviewService.js    # 리뷰 & 평점 관리
│   │   └── TicketService.js    # 티켓 관리
│   ├── middleware/
│   │   └── auth.js             # JWT 인증 미들웨어
│   ├── routes/
│   │   ├── auth.js             # 인증 라우트
│   │   ├── reviews.js          # 리뷰 라우트
│   │   └── tickets.js          # 티켓 라우트
│   └── app.js                  # 메인 앱 파일
├── logs/                       # 로그 파일
├── package.json
└── README.md
```

## 🚀 **설치 및 실행**

### 1. 의존성 설치
```bash
cd groume-backend
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 설정
```

### 3. 데이터베이스 설정
```sql
-- PostgreSQL에서 실행
CREATE DATABASE groume;
-- database_schema.sql 실행하여 테이블 생성
```

### 4. 서버 실행
```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

## 📚 **API 엔드포인트**

### 🔐 **인증 (Auth)**
```http
POST /api/auth/register        # 회원가입
POST /api/auth/login           # 로그인
GET  /api/auth/profile         # 내 프로필 조회
PUT  /api/auth/profile         # 프로필 업데이트
PUT  /api/auth/password        # 비밀번호 변경
```

### ⭐ **리뷰 (Reviews)**
```http
POST   /api/reviews                      # 리뷰 작성 (평점 자동 업데이트)
GET    /api/reviews/received             # 내가 받은 리뷰
GET    /api/reviews/user/:userId         # 특정 사용자 리뷰
GET    /api/reviews/matching/:meetingId  # 매칭별 리뷰
DELETE /api/reviews/:reviewId            # 리뷰 삭제 (평점 재계산)
```

### 🎫 **티켓 (Tickets)**
```http
GET  /api/tickets/my                     # 내 티켓 조회
POST /api/tickets/use                    # 티켓 사용 (개수 자동 업데이트)
POST /api/tickets/mission-reward         # 미션 보상 지급
POST /api/tickets/issue                  # 티켓 지급 (관리자)
```

## 🔄 **비즈니스 로직 처리**

### 📊 **리뷰 생성 시 평점 자동 업데이트**
```javascript
// 트리거 ❌ → 백엔드 서비스 ✅
await ReviewService.createReview({
  reviewer_id: 1,
  reviewee_id: 2, 
  rating: 4.5
});
// ✅ 자동으로 사용자 평점 재계산 및 업데이트
```

### 🎫 **티켓 사용 시 개수 자동 관리**
```javascript
// 트리거 ❌ → 백엔드 서비스 ✅
await TicketService.useTicket(userId, 3, '미팅 신청');
// ✅ 자동으로 사용자 티켓 개수 업데이트
```

### 🔒 **트랜잭션으로 데이터 일관성 보장**
```javascript
return await transaction(async (client) => {
  // 1. 리뷰 생성
  const review = await client.query('INSERT INTO review...');
  
  // 2. 평점 업데이트
  await this.updateUserRating(reviewee_id, client);
  
  // 모두 성공 시 커밋, 실패 시 롤백
});
```

## 🧪 **API 테스트 예제**

### 회원가입
```bash
curl -X POST http://localhost:3030/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123",
    "name": "테스트유저",
    "age": 25,
    "gender": "male",
    "region": "서울"
  }'
```

### 리뷰 작성 (평점 자동 업데이트)
```bash
curl -X POST http://localhost:3030/api/reviews \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reviewee_id": 2,
    "matched_meeting_id": 1,
    "rating": 4.5,
    "comment": "좋은 만남이었습니다!"
  }'
```

### 티켓 사용 (개수 자동 업데이트)
```bash
curl -X POST http://localhost:3030/api/tickets/use \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1,
    "purpose": "미팅 신청"
  }'
```

## 🔧 **환경 변수**

```env
# 서버 설정
PORT=3030
NODE_ENV=development

# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_NAME=groume
DB_USER=postgres
DB_PASSWORD=your_password
DB_SCHEMA=groume

# JWT 설정
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:19006
```

## 🏃‍♂️ **개발 모드 실행**

```bash
# 1. 데이터베이스 실행 (Docker)
docker run --name groume-postgres \\
  -e POSTGRES_DB=groume \\
  -e POSTGRES_USER=postgres \\
  -e POSTGRES_PASSWORD=password \\
  -p 5432:5432 -d postgres:15

# 2. 스키마 생성
psql -h localhost -U postgres -d groume -f ../database_schema.sql

# 3. 백엔드 서버 실행
npm run dev
# 서버가 http://localhost:3030 에서 실행됩니다
```

## 📈 **주요 개선사항**

### 🔄 **트리거 → 백엔드 로직 이전**
| 기능 | 기존 (트리거) | 개선 (백엔드) |
|------|---------------|---------------|
| **평점 업데이트** | DB 트리거 자동 실행 | ReviewService에서 트랜잭션 처리 |
| **티켓 개수 관리** | DB 트리거 자동 실행 | TicketService에서 트랜잭션 처리 |
| **에러 처리** | 디버깅 어려움 | 명확한 에러 메시지 및 로깅 |
| **테스트** | DB 의존적 | 서비스 단위 테스트 가능 |
| **확장성** | DB에 종속적 | 마이크로서비스 분리 가능 |

### 🛡️ **보안 및 안정성**
- JWT 기반 인증
- bcrypt 비밀번호 암호화
- Joi 입력 데이터 검증
- Helmet 보안 헤더
- 트랜잭션으로 데이터 일관성 보장

## 🎯 **다음 단계**

1. **매칭 서비스** 구현
2. **미팅 관리** API 추가
3. **실시간 알림** (Socket.io) 연동
4. **파일 업로드** (프로필 이미지) 구현
5. **단위 테스트** 작성

---

✨ **그루미 백엔드 API로 더 안전하고 확장 가능한 서비스를 만들어보세요!**
