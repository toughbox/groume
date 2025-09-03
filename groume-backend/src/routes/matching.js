const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query, transaction } = require('../config/database');

/**
 * 새 미팅 생성
 */
router.post('/meetings', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      meeting_place, 
      preferred_region, 
      group_size, 
      min_age, 
      max_age,
      preferred_dates 
    } = req.body;
    const userId = req.user.userId;

    console.log('📝 미팅 생성 데이터:', req.body);

    // 데이터베이스에 미팅 저장
    const meetingResult = await query(`
      INSERT INTO groume.meeting (
        leader_id, title, description, meeting_place, preferred_region,
        group_size, min_age, max_age, preferred_dates, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING *
    `, [userId, title, description, meeting_place, preferred_region, 
        group_size, min_age, max_age, JSON.stringify(preferred_dates || [])]);

    const newMeeting = meetingResult.rows[0];
    console.log('✅ 미팅 DB 저장 완료:', newMeeting);

    res.status(201).json({
      success: true,
      message: '미팅이 성공적으로 생성되었습니다.',
      data: newMeeting
    });

  } catch (error) {
    console.error('❌ 미팅 생성 에러:', error);
    res.status(500).json({
      success: false,
      message: '미팅 생성 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 미팅 목록 조회
 */
router.get('/meetings', authenticateToken, async (req, res) => {
  try {
    const meetingsResult = await query(`
      SELECT 
        m.*,
        u.username as leader_username,
        u.name as leader_name
      FROM groume.meeting m
      JOIN groume."user" u ON m.leader_id = u.id
      WHERE m.status = 'active'
      ORDER BY m.created_at DESC
    `);

    res.json({
      success: true,
      message: '미팅 목록을 성공적으로 조회했습니다.',
      data: meetingsResult.rows
    });

  } catch (error) {
    console.error('❌ 미팅 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '미팅 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 미팅 참가 신청
 */
router.post('/meetings/:id/join', authenticateToken, async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const userId = req.user.userId;

    const meeting = meetings.find(m => m.id === meetingId);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '미팅을 찾을 수 없습니다.'
      });
    }

    if (meeting.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: '이미 참가 신청한 미팅입니다.'
      });
    }

    if (meeting.participants.length >= meeting.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: '참가 인원이 가득 찼습니다.'
      });
    }

    meeting.participants.push(userId);

    res.json({
      success: true,
      message: '미팅 참가 신청이 완료되었습니다.',
      data: meeting
    });

  } catch (error) {
    console.error('미팅 참가 에러:', error);
    res.status(500).json({
      success: false,
      message: '미팅 참가 신청 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 내가 생성한 미팅 조회
 */
router.get('/my-meetings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const myMeetings = meetings.filter(m => m.createdBy === userId);

    res.json({
      success: true,
      message: '내 미팅 목록을 성공적으로 조회했습니다.',
      data: myMeetings
    });

  } catch (error) {
    console.error('내 미팅 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '내 미팅 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
