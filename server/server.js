const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 라우터 import
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const matchingRoutes = require('./routes/matching');

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 미들웨어
app.use(helmet());

// CORS 설정
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:19006',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100개 요청
  message: {
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use('/api/', limiter);

// 로깅
app.use(morgan('combined'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matching', matchingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '그루미 서버가 정상적으로 실행 중입니다!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 엔드포인트를 찾을 수 없습니다.'
  });
});

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error('에러 발생:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '서버 내부 오류가 발생했습니다.' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 그루미 서버가 포트 ${PORT}에서 실행 중입니다!`);
  console.log(`📱 앱 URL: ${process.env.CLIENT_URL || 'http://localhost:19006'}`);
  console.log(`🌐 서버 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔒 환경: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
