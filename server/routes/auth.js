const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db = require('../config/database');

const router = express.Router();

// 인증 관련 Rate Limiting (더 엄격하게)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5회 시도
  message: {
    success: false,
    message: '너무 많은 로그인 시도가 발생했습니다. 15분 후 다시 시도해주세요.'
  }
});

// JWT 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// 회원가입 유효성 검증 규칙
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('아이디는 3자 이상 50자 이하여야 합니다.')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('아이디는 영문, 숫자, 언더스코어만 사용 가능합니다.'),
  
  body('email')
    .isEmail()
    .withMessage('올바른 이메일 형식을 입력해주세요.')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('비밀번호는 8자 이상이어야 합니다.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 영문 대소문자와 숫자를 포함해야 합니다.'),
  
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('이름은 2자 이상 100자 이하여야 합니다.')
    .trim(),
  
  body('age')
    .isInt({ min: 18, max: 100 })
    .withMessage('나이는 18세 이상 100세 이하여야 합니다.'),
  
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('성별은 male 또는 female이어야 합니다.'),
  
  body('region')
    .isLength({ min: 2, max: 50 })
    .withMessage('지역을 선택해주세요.')
    .trim(),
  
  body('phone')
    .optional()
    .matches(/^[0-9-+\s()]+$/)
    .withMessage('올바른 전화번호 형식을 입력해주세요.'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('자기소개는 500자 이하여야 합니다.')
];

// 로그인 유효성 검증 규칙
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('아이디를 입력해주세요.'),
  
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.')
];

// 회원가입 엔드포인트
router.post('/register', registerValidation, async (req, res) => {
  try {
    // 유효성 검증 결과 확인
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const {
      username,
      email,
      password,
      name,
      age,
      gender,
      region,
      phone,
      bio
    } = req.body;

    // 중복 사용자 확인
    const existingUser = await db.query(
      'SELECT id FROM groume.user WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 아이디 또는 이메일입니다.'
      });
    }

    // 비밀번호 해시화
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 사용자 생성
    const result = await db.query(`
      INSERT INTO groume.user (
        username, email, password_hash, name, age, gender, region, phone, bio, interests
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, username, email, name, age, gender, region, phone, bio, 
                interests, ticket_count, rating, rating_count, created_at, is_active
    `, [username, email, passwordHash, name, age, gender, region, phone || null, bio || null, JSON.stringify([])]);

    const newUser = result.rows[0];

    // JWT 토큰 생성
    const token = generateToken(newUser.id);

    // 응답 (비밀번호 해시 제외)
    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        age: newUser.age,
        gender: newUser.gender,
        region: newUser.region,
        phone: newUser.phone,
        bio: newUser.bio,
        interests: newUser.interests,
        ticketCount: newUser.ticket_count,
        rating: parseFloat(newUser.rating),
        ratingCount: newUser.rating_count,
        createdAt: newUser.created_at,
        isActive: newUser.is_active
      },
      token
    });

  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.'
    });
  }
});

// 로그인 엔드포인트
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    // 유효성 검증 결과 확인
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 올바르지 않습니다.',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // 사용자 조회
    const result = await db.query(`
      SELECT id, username, email, password_hash, name, age, gender, region, 
             phone, bio, interests, ticket_count, rating, rating_count, 
             created_at, last_login, is_active
      FROM groume.user 
      WHERE username = $1 OR email = $1
    `, [username]);

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 계정 활성화 상태 확인
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: '비활성화된 계정입니다. 고객센터에 문의해주세요.'
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 마지막 로그인 시간 업데이트
    await db.query(
      'UPDATE groume.user SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // JWT 토큰 생성
    const token = generateToken(user.id);

    // 응답 (비밀번호 해시 제외)
    res.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        region: user.region,
        phone: user.phone,
        bio: user.bio,
        interests: user.interests,
        ticketCount: user.ticket_count,
        rating: parseFloat(user.rating),
        ratingCount: user.rating_count,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        isActive: user.is_active
      },
      token
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.'
    });
  }
});

// 로그아웃 엔드포인트 (토큰 무효화는 클라이언트에서 처리)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: '로그아웃이 완료되었습니다.'
  });
});

// 토큰 검증 엔드포인트
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '토큰이 제공되지 않았습니다.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 정보 조회
    const result = await db.query(`
      SELECT id, username, email, name, age, gender, region, phone, bio, 
             interests, ticket_count, rating, rating_count, created_at, 
             last_login, is_active
      FROM groume.user 
      WHERE id = $1 AND is_active = true
    `, [decoded.userId]);

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        region: user.region,
        phone: user.phone,
        bio: user.bio,
        interests: user.interests,
        ticketCount: user.ticket_count,
        rating: parseFloat(user.rating),
        ratingCount: user.rating_count,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        isActive: user.is_active
      }
    });

  } catch (error) {
    console.error('토큰 검증 에러:', error);
    res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
});

module.exports = router;
