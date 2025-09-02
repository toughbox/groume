const jwt = require('jsonwebtoken');

// JWT 토큰 인증 미들웨어
const authMiddleware = (req, res, next) => {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 제공되지 않았습니다.'
      });
    }

    // Bearer 토큰 형식 확인
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '올바르지 않은 토큰 형식입니다.'
      });
    }

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 요청 객체에 사용자 정보 추가
    req.user = { id: decoded.userId };
    req.userId = decoded.userId; // 하위 호환성을 위해 유지
    
    next();

  } catch (error) {
    console.error('토큰 인증 에러:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    res.status(401).json({
      success: false,
      message: '토큰 인증에 실패했습니다.'
    });
  }
};

module.exports = {
  authenticateToken: authMiddleware,
  authMiddleware
};
