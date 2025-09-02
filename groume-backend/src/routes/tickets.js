const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, requireAdmin, requireOwner } = require('../middleware/auth');

/**
 * 티켓 관련 라우트
 */

// 내 티켓 내역 조회 (로그인 필요)
router.get('/my', authenticateToken, ticketController.getMyTickets);

// 티켓 사용 (로그인 필요)
router.post('/use', authenticateToken, ticketController.useTicket);

// 미션 완료 보상 지급 (로그인 필요)
router.post('/mission-reward', authenticateToken, ticketController.issueMissionReward);

// === 관리자 전용 라우트 ===

// 티켓 지급 (관리자 전용)
router.post('/issue', authenticateToken, requireAdmin, ticketController.issueTicket);

// 특정 사용자 티켓 조회 (관리자 전용)
router.get('/user/:userId', authenticateToken, requireAdmin, ticketController.getUserTickets);

// 사용자 티켓 개수 재계산 (관리자 전용)
router.post('/recalculate/:userId', authenticateToken, requireAdmin, ticketController.recalculateUserTickets);

// 만료된 티켓 정리 (관리자 전용)
router.post('/cleanup-expired', authenticateToken, requireAdmin, ticketController.cleanupExpiredTickets);

module.exports = router;
