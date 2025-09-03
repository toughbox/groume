const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { query, transaction } = require('../config/database');

// 한국 시간 헬퍼 함수
const getKoreanTime = () => {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
};

/**
 * 새 미팅 생성 (1번 구현: 리더를 meeting_member에 자동 추가)
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

    // 트랜잭션으로 미팅과 리더 참가 정보를 함께 저장
    const result = await transaction(async (client) => {
      // 1. 미팅 생성
      const meetingResult = await client.query(`
        INSERT INTO groume.meeting (
          leader_id, title, description, meeting_place, preferred_region,
          group_size, min_age, max_age, preferred_dates, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
        RETURNING *
      `, [userId, title, description, meeting_place, preferred_region, 
          group_size, min_age, max_age, JSON.stringify(preferred_dates || [])]);

      const newMeeting = meetingResult.rows[0];

      // 2. 리더를 meeting_member에 추가 (1번 구현)
      await client.query(`
        INSERT INTO groume.meeting_member (meeting_id, user_id, role, is_confirmed)
        VALUES ($1, $2, 'leader', true)
      `, [newMeeting.id, userId]);

      console.log('✅ 미팅 및 리더 참가 정보 DB 저장 완료:', newMeeting);
      return newMeeting;
    });

    const newMeeting = result;

    // 한국 시간으로 변환하여 응답
    const meetingWithKST = {
      ...newMeeting,
      created_at: new Date(newMeeting.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      updated_at: new Date(newMeeting.updated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      expires_at: new Date(newMeeting.expires_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
    };

    res.status(201).json({
      success: true,
      message: '미팅이 성공적으로 생성되었습니다.',
      data: meetingWithKST
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
 * 미팅 목록 조회 (2번 구현: 참가자 수 포함)
 */
router.get('/meetings', authenticateToken, async (req, res) => {
  try {
    const meetingsResult = await query(`
      SELECT 
        m.*,
        u.username as leader_username,
        u.name as leader_name,
        TIMEZONE('Asia/Seoul', m.created_at) as created_at_kst,
        TIMEZONE('Asia/Seoul', m.updated_at) as updated_at_kst,
        TIMEZONE('Asia/Seoul', m.expires_at) as expires_at_kst,
        COUNT(mm.user_id) as current_members
      FROM groume.meeting m
      JOIN groume."user" u ON m.leader_id = u.id
      LEFT JOIN groume.meeting_member mm ON m.id = mm.meeting_id AND mm.is_confirmed = true
      WHERE m.status = 'active'
      GROUP BY m.id, u.username, u.name
      ORDER BY m.created_at DESC
    `);

    // 시간 데이터를 한국 시간으로 변환
    const meetings = meetingsResult.rows.map(meeting => ({
      ...meeting,
      created_at: meeting.created_at_kst,
      updated_at: meeting.updated_at_kst,
      expires_at: meeting.expires_at_kst
    }));

    res.json({
      success: true,
      message: '미팅 목록을 성공적으로 조회했습니다.',
      data: meetings
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
 * 미팅 참가 신청 (3번 구현)
 */
router.post('/meetings/:id/join', authenticateToken, async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const userId = req.user.userId;

    console.log(`📝 미팅 참가 신청: 사용자 ${userId} -> 미팅 ${meetingId}`);

    // 트랜잭션으로 안전하게 처리
    const result = await transaction(async (client) => {
      // 1. 미팅 정보 조회 (현재 참가자 수 포함)
      const meetingResult = await client.query(`
        SELECT 
          m.*,
          COUNT(mm.user_id) as current_members
        FROM groume.meeting m
        LEFT JOIN groume.meeting_member mm ON m.id = mm.meeting_id AND mm.is_confirmed = true
        WHERE m.id = $1 AND m.status = 'active'
        GROUP BY m.id
      `, [meetingId]);

      if (meetingResult.rows.length === 0) {
        throw new Error('미팅을 찾을 수 없거나 이미 종료된 미팅입니다.');
      }

      const meeting = meetingResult.rows[0];

      // 2. 자기 자신의 미팅인지 확인
      if (meeting.leader_id === userId) {
        throw new Error('자신이 생성한 미팅에는 참가 신청할 수 없습니다.');
      }

      // 3. 이미 참가했는지 확인
      const existingMember = await client.query(`
        SELECT id FROM groume.meeting_member 
        WHERE meeting_id = $1 AND user_id = $2
      `, [meetingId, userId]);

      if (existingMember.rows.length > 0) {
        throw new Error('이미 참가 신청한 미팅입니다.');
      }

      // 4. 참가 인원 확인
      if (parseInt(meeting.current_members) >= parseInt(meeting.group_size)) {
        throw new Error('참가 인원이 가득 찼습니다.');
      }

      // 5. 사용자 나이 확인
      const userResult = await client.query(`
        SELECT age FROM groume."user" WHERE id = $1
      `, [userId]);

      const userAge = userResult.rows[0].age;
      if (userAge < meeting.min_age || userAge > meeting.max_age) {
        throw new Error(`나이 조건에 맞지 않습니다. (${meeting.min_age}세 ~ ${meeting.max_age}세)`);
      }

      // 6. 참가 신청 추가
      const joinResult = await client.query(`
        INSERT INTO groume.meeting_member (meeting_id, user_id, role, is_confirmed)
        VALUES ($1, $2, 'member', true)
        RETURNING *
      `, [meetingId, userId]);

      console.log('✅ 미팅 참가 신청 완료:', joinResult.rows[0]);

      // 7. 업데이트된 미팅 정보 반환
      const updatedMeetingResult = await client.query(`
        SELECT 
          m.*,
          COUNT(mm.user_id) as current_members
        FROM groume.meeting m
        LEFT JOIN groume.meeting_member mm ON m.id = mm.meeting_id AND mm.is_confirmed = true
        WHERE m.id = $1
        GROUP BY m.id
      `, [meetingId]);

      return updatedMeetingResult.rows[0];
    });

    res.json({
      success: true,
      message: '미팅 참가 신청이 완료되었습니다!',
      data: {
        meeting: result,
        current_members: result.current_members,
        remaining_slots: result.group_size - result.current_members
      }
    });

  } catch (error) {
    console.error('❌ 미팅 참가 에러:', error);
    res.status(400).json({
      success: false,
      message: error.message || '미팅 참가 신청 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 미팅 참가 취소
 */
router.delete('/meetings/:id/leave', authenticateToken, async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const userId = req.user.userId;

    console.log(`📝 미팅 참가 취소: 사용자 ${userId} -> 미팅 ${meetingId}`);

    const result = await transaction(async (client) => {
      // 1. 미팅 정보 확인
      const meetingResult = await client.query(`
        SELECT leader_id FROM groume.meeting WHERE id = $1 AND status = 'active'
      `, [meetingId]);

      if (meetingResult.rows.length === 0) {
        throw new Error('미팅을 찾을 수 없습니다.');
      }

      const meeting = meetingResult.rows[0];

      // 2. 리더는 참가 취소 불가
      if (meeting.leader_id === userId) {
        throw new Error('미팅 리더는 참가를 취소할 수 없습니다.');
      }

      // 3. 참가 정보 확인
      const memberResult = await client.query(`
        SELECT id FROM groume.meeting_member 
        WHERE meeting_id = $1 AND user_id = $2
      `, [meetingId, userId]);

      if (memberResult.rows.length === 0) {
        throw new Error('참가하지 않은 미팅입니다.');
      }

      // 4. 참가 취소
      await client.query(`
        DELETE FROM groume.meeting_member 
        WHERE meeting_id = $1 AND user_id = $2
      `, [meetingId, userId]);

      console.log('✅ 미팅 참가 취소 완료');
      return true;
    });

    res.json({
      success: true,
      message: '미팅 참가가 취소되었습니다.'
    });

  } catch (error) {
    console.error('❌ 미팅 참가 취소 에러:', error);
    res.status(400).json({
      success: false,
      message: error.message || '미팅 참가 취소 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 내가 생성한 미팅 조회 (참가자 수 포함)
 */
router.get('/my-meetings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const myMeetingsResult = await query(`
      SELECT 
        m.*,
        COUNT(mm.user_id) as current_members,
        TIMEZONE('Asia/Seoul', m.created_at) as created_at_kst,
        TIMEZONE('Asia/Seoul', m.updated_at) as updated_at_kst,
        TIMEZONE('Asia/Seoul', m.expires_at) as expires_at_kst
      FROM groume.meeting m
      LEFT JOIN groume.meeting_member mm ON m.id = mm.meeting_id AND mm.is_confirmed = true
      WHERE m.leader_id = $1
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `, [userId]);

    // 시간 데이터를 한국 시간으로 변환
    const meetings = myMeetingsResult.rows.map(meeting => ({
      ...meeting,
      created_at: meeting.created_at_kst,
      updated_at: meeting.updated_at_kst,
      expires_at: meeting.expires_at_kst
    }));

    res.json({
      success: true,
      message: '내 미팅 목록을 성공적으로 조회했습니다.',
      data: meetings
    });

  } catch (error) {
    console.error('❌ 내 미팅 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '내 미팅 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 내가 참가한 미팅 조회
 */
router.get('/joined-meetings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const joinedMeetingsResult = await query(`
      SELECT 
        m.*,
        u.username as leader_username,
        u.name as leader_name,
        COUNT(mm2.user_id) as current_members,
        TIMEZONE('Asia/Seoul', m.created_at) as created_at_kst,
        TIMEZONE('Asia/Seoul', m.updated_at) as updated_at_kst,
        TIMEZONE('Asia/Seoul', m.expires_at) as expires_at_kst,
        TIMEZONE('Asia/Seoul', mm.joined_at) as joined_at_kst
      FROM groume.meeting_member mm
      JOIN groume.meeting m ON mm.meeting_id = m.id
      JOIN groume."user" u ON m.leader_id = u.id
      LEFT JOIN groume.meeting_member mm2 ON m.id = mm2.meeting_id AND mm2.is_confirmed = true
      WHERE mm.user_id = $1 AND mm.is_confirmed = true
      GROUP BY m.id, u.username, u.name, mm.joined_at
      ORDER BY mm.joined_at DESC
    `, [userId]);

    // 시간 데이터를 한국 시간으로 변환
    const meetings = joinedMeetingsResult.rows.map(meeting => ({
      ...meeting,
      created_at: meeting.created_at_kst,
      updated_at: meeting.updated_at_kst,
      expires_at: meeting.expires_at_kst,
      joined_at: meeting.joined_at_kst
    }));

    res.json({
      success: true,
      message: '참가한 미팅 목록을 성공적으로 조회했습니다.',
      data: meetings
    });

  } catch (error) {
    console.error('❌ 참가한 미팅 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '참가한 미팅 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 미팅의 참가자 목록 조회
 */
router.get('/meetings/:id/members', authenticateToken, async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);

    const membersResult = await query(`
      SELECT 
        mm.*,
        u.username,
        u.name,
        u.age,
        u.gender,
        TIMEZONE('Asia/Seoul', mm.joined_at) as joined_at_kst
      FROM groume.meeting_member mm
      JOIN groume."user" u ON mm.user_id = u.id
      WHERE mm.meeting_id = $1 AND mm.is_confirmed = true
      ORDER BY mm.role DESC, mm.joined_at ASC
    `, [meetingId]);

    // 시간 데이터를 한국 시간으로 변환
    const members = membersResult.rows.map(member => ({
      ...member,
      joined_at: member.joined_at_kst
    }));

    res.json({
      success: true,
      message: '미팅 참가자 목록을 성공적으로 조회했습니다.',
      data: members
    });

  } catch (error) {
    console.error('❌ 미팅 참가자 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '미팅 참가자 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;