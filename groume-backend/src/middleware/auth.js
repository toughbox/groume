const jwt = require('jsonwebtoken');

/**
 * JWT 토큰 검증 미들웨어
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '액세스 토큰이 없습니다. 로그인이 필요합니다.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT 검증 실패:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '토큰이 만료되었습니다. 다시 로그인해주세요.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 토큰입니다.',
          code: 'INVALID_TOKEN'
        });
      }

      return res.status(401).json({
        success: false,
        message: '토큰 검증에 실패했습니다.',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }

    // 사용자 정보를 req.user에 저장
    req.user = user;
    next();
  });
};

/**
 * 선택적 토큰 검증 미들웨어 (토큰이 있으면 검증, 없어도 통과)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // 토큰이 없어도 통과
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('선택적 JWT 검증 실패:', err.message);
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

/**
 * 관리자 권한 확인 미들웨어
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증이 필요합니다.'
    });
  }

  // 관리자 계정 확인 (username이 'admin'이거나 특정 조건)
  if (req.user.username !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: '관리자 권한이 필요합니다.'
    });
  }

  next();
};

/**
 * 사용자 본인 확인 미들웨어
 */
const requireOwner = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const requestedUserId = parseInt(req.params[paramName]);
    const currentUserId = req.user.userId;

    // 본인이거나 관리자인 경우 통과
    if (requestedUserId === currentUserId || req.user.username === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: '본인의 정보만 접근할 수 있습니다.'
    });
  };
};

/**
 * API 키 검증 미들웨어 (관리자 API용)
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.ADMIN_API_KEY;

  if (!validApiKey) {
    console.warn('ADMIN_API_KEY가 설정되지 않았습니다.');
    return next(); // 개발 환경에서는 통과
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 API 키입니다.'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireOwner,
  validateApiKey
};
