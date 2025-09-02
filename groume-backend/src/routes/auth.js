const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

/**
 * 인증 관련 라우트
 */

// 회원가입
router.post('/register', authController.register);

// 로그인
router.post('/login', authController.login);

// 내 프로필 조회 (로그인 필요)
router.get('/profile', authenticateToken, authController.getMyProfile);

// 프로필 업데이트 (로그인 필요)
router.put('/profile', authenticateToken, authController.updateProfile);

// 비밀번호 변경 (로그인 필요)
router.put('/password', authenticateToken, authController.changePassword);

module.exports = router;
