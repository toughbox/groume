const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

/**
 * 리뷰 관련 라우트
 */

// 리뷰 작성 (로그인 필요)
router.post('/', authenticateToken, reviewController.createReview);

// 내가 받은 리뷰 조회 (로그인 필요)
router.get('/received', authenticateToken, reviewController.getReceivedReviews);

// 특정 사용자의 공개 리뷰 조회 (선택적 로그인)
router.get('/user/:userId', optionalAuth, reviewController.getUserReviews);

// 특정 매칭의 리뷰 조회 (로그인 필요)
router.get('/matching/:matchedMeetingId', authenticateToken, reviewController.getReviewsByMatching);

// 리뷰 삭제 (로그인 필요, 본인만)
router.delete('/:reviewId', authenticateToken, reviewController.deleteReview);

// 사용자 평점 수동 재계산 (관리자 전용)
router.post('/recalculate/:userId', authenticateToken, requireAdmin, reviewController.recalculateUserRating);

module.exports = router;
