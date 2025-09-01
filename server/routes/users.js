const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 모든 사용자 라우트에 인증 미들웨어 적용
router.use(authMiddleware);

// 프로필 조회
router.get('/profile', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, username, email, name, age, gender, region, phone, bio, 
             profile_image_url, interests, ticket_count, rating, rating_count, 
             created_at, last_login, is_active
      FROM groume.user 
      WHERE id = $1
    `, [req.userId]);

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
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
        profileImageUrl: user.profile_image_url,
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
    console.error('프로필 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다.'
    });
  }
});

// 프로필 업데이트 유효성 검증
const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('이름은 2자 이상 100자 이하여야 합니다.')
    .trim(),
  
  body('age')
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage('나이는 18세 이상 100세 이하여야 합니다.'),
  
  body('region')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('지역은 2자 이상 50자 이하여야 합니다.')
    .trim(),
  
  body('phone')
    .optional()
    .matches(/^[0-9-+\s()]+$/)
    .withMessage('올바른 전화번호 형식을 입력해주세요.'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('자기소개는 500자 이하여야 합니다.'),
  
  body('interests')
    .optional()
    .isArray()
    .withMessage('관심사는 배열 형태여야 합니다.'),
  
  body('interests.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('각 관심사는 1자 이상 50자 이하여야 합니다.')
];

// 프로필 업데이트
router.put('/profile', updateProfileValidation, async (req, res) => {
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
      name,
      age,
      region,
      phone,
      bio,
      interests
    } = req.body;

    // 업데이트할 필드만 동적으로 구성
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (age !== undefined) {
      updateFields.push(`age = $${paramCount++}`);
      values.push(age);
    }
    if (region !== undefined) {
      updateFields.push(`region = $${paramCount++}`);
      values.push(region);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (bio !== undefined) {
      updateFields.push(`bio = $${paramCount++}`);
      values.push(bio);
    }
    if (interests !== undefined) {
      updateFields.push(`interests = $${paramCount++}`);
      values.push(JSON.stringify(interests));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: '업데이트할 필드가 없습니다.'
      });
    }

    // updated_at 추가
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.userId);

    const query = `
      UPDATE groume.user 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, name, age, gender, region, phone, bio, 
                profile_image_url, interests, ticket_count, rating, rating_count, 
                created_at, updated_at, last_login, is_active
    `;

    const result = await db.query(query, values);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        age: updatedUser.age,
        gender: updatedUser.gender,
        region: updatedUser.region,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        profileImageUrl: updatedUser.profile_image_url,
        interests: updatedUser.interests,
        ticketCount: updatedUser.ticket_count,
        rating: parseFloat(updatedUser.rating),
        ratingCount: updatedUser.rating_count,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
        lastLogin: updatedUser.last_login,
        isActive: updatedUser.is_active
      }
    });

  } catch (error) {
    console.error('프로필 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 티켓 정보 조회
router.get('/tickets', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, ticket_type, amount, source, description, created_at, 
             expires_at, is_used, used_at
      FROM groume.ticket 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [req.userId]);

    res.json({
      success: true,
      tickets: result.rows.map(ticket => ({
        id: ticket.id,
        ticketType: ticket.ticket_type,
        amount: ticket.amount,
        source: ticket.source,
        description: ticket.description,
        createdAt: ticket.created_at,
        expiresAt: ticket.expires_at,
        isUsed: ticket.is_used,
        usedAt: ticket.used_at
      }))
    });

  } catch (error) {
    console.error('티켓 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '티켓 조회 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 미션 정보 조회
router.get('/missions', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT um.id, um.status, um.progress, um.max_progress, um.started_at, 
             um.completed_at, um.claimed_at,
             m.title, m.description, m.mission_type, m.reward_tickets, m.requirements
      FROM groume.user_mission um
      JOIN groume.mission m ON um.mission_id = m.id
      WHERE um.user_id = $1 
      ORDER BY um.started_at DESC
    `, [req.userId]);

    res.json({
      success: true,
      missions: result.rows.map(mission => ({
        id: mission.id,
        status: mission.status,
        progress: mission.progress,
        maxProgress: mission.max_progress,
        startedAt: mission.started_at,
        completedAt: mission.completed_at,
        claimedAt: mission.claimed_at,
        title: mission.title,
        description: mission.description,
        missionType: mission.mission_type,
        rewardTickets: mission.reward_tickets,
        requirements: mission.requirements
      }))
    });

  } catch (error) {
    console.error('미션 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '미션 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
