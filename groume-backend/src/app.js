const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

// 라우터 import
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const ticketRoutes = require('./routes/tickets');

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 3030;

// 로거 설정
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'groume-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 개발 환경에서는 콘솔 로그 추가
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 보안 미들웨어
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 설정
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:19006', 'http://localhost:3030'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 바디 파서
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// API 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tickets', ticketRoutes);

// 루트 경로
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 그루미(Groume) API 서버가 정상적으로 실행중입니다!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      reviews: '/api/reviews',
      tickets: '/api/tickets'
    }
  });
});

// 헬스체크 엔드포인트
app.get('/health', async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    const { query } = require('./config/database');
    await query('SELECT 1 as health_check');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      auth: '/api/auth',
      reviews: '/api/reviews',
      tickets: '/api/tickets'
    }
  });
});

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  logger.error('Unhandled Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '서버 내부 오류가 발생했습니다.' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// 프로세스 종료 핸들러
process.on('SIGTERM', () => {
  logger.info('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

// 처리되지 않은 Promise rejection 핸들러
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`
🚀 그루미(Groume) API 서버가 시작되었습니다!
📍 포트: ${PORT}
🌍 환경: ${process.env.NODE_ENV || 'development'}
📚 API 문서: http://localhost:${PORT}/
💫 상태 확인: http://localhost:${PORT}/health

🔗 주요 엔드포인트:
   - 인증: http://localhost:${PORT}/api/auth
   - 리뷰: http://localhost:${PORT}/api/reviews  
   - 티켓: http://localhost:${PORT}/api/tickets
  `);
  
  logger.info('Groume API Server started', { port: PORT, env: process.env.NODE_ENV });
});

module.exports = app;
