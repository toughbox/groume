const express = require('express');
const { Pool } = require('pg');
const authenticateToken = require('../middleware/auth').authenticateToken;

const router = express.Router();

// 데이터베이스 연결
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'groume',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

/**
 * @route   POST /api/matching/meetings
 * @desc    새로운 미팅 생성
 * @access  Private
 */
router.post('/meetings', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      title,
      description,
      group_size,
      min_age,
      max_age,
      preferred_region,
      meeting_place,
      preferred_dates,
      members
    } = req.body;

    const user_id = req.user.id;

    // 디버깅을 위한 요청 데이터 로깅
    console.log('미팅 생성 요청 데이터:', {
      title,
      description,
      group_size,
      min_age,
      max_age,
      preferred_region,
      meeting_place,
      preferred_dates,
      preferred_dates_type: typeof preferred_dates
    });

    // 입력 검증
    if (!title || !group_size || !min_age || !max_age || !preferred_region || !meeting_place) {
      return res.status(400).json({
        success: false,
        message: '필수 정보를 모두 입력해주세요.'
      });
    }

    if (group_size < 2 || group_size > 10) {
      return res.status(400).json({
        success: false,
        message: '그룹 크기는 2명에서 10명 사이여야 합니다.'
      });
    }

    if (min_age < 18 || max_age < min_age) {
      return res.status(400).json({
        success: false,
        message: '나이 조건을 올바르게 설정해주세요.'
      });
    }

    // 사용자 티켓 확인
    const ticketCheck = await client.query(
      'SELECT ticket_count FROM groume.user WHERE id = $1',
      [user_id]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    if (ticketCheck.rows[0].ticket_count < 1) {
      return res.status(400).json({
        success: false,
        message: '매칭 티켓이 부족합니다.'
      });
    }

    await client.query('BEGIN');

    // 미팅 생성
    const meetingResult = await client.query(
      `INSERT INTO groume.meeting 
       (title, description, leader_id, group_size, min_age, max_age, preferred_region, meeting_place, preferred_dates)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, user_id, group_size, min_age, max_age, preferred_region, meeting_place, JSON.stringify(preferred_dates || [])]
    );

    const meeting = meetingResult.rows[0];

    // 리더를 멤버로 추가
    await client.query(
      `INSERT INTO groume.meeting_member (meeting_id, user_id, role, is_confirmed)
       VALUES ($1, $2, 'leader', true)`,
      [meeting.id, user_id]
    );

    // 멤버들 추가 (있는 경우)
    if (members && Array.isArray(members)) {
      for (const member of members) {
        if (member.user_id && member.user_id !== user_id) {
          await client.query(
            `INSERT INTO groume.meeting_member (meeting_id, user_id, role, is_confirmed)
             VALUES ($1, $2, 'member', false)`,
            [meeting.id, member.user_id]
          );
        }
      }
    }

    // 티켓 차감
    await client.query(
      'UPDATE groume.user SET ticket_count = ticket_count - 1 WHERE id = $1',
      [user_id]
    );

    // 티켓 사용 기록은 별도 테이블이나 로그로 관리
    // (현재는 user 테이블의 ticket_count만 차감)

    await client.query('COMMIT');

    // 디버깅을 위한 로그 추가
    console.log('미팅 생성 성공 - preferred_dates 값:', meeting.preferred_dates);
    console.log('preferred_dates 타입:', typeof meeting.preferred_dates);

    // 안전한 JSON 파싱
    let parsedDates = [];
    if (meeting.preferred_dates) {
      try {
        parsedDates = JSON.parse(meeting.preferred_dates);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('파싱 시도한 값:', meeting.preferred_dates);
        parsedDates = [];
      }
    }

    res.status(201).json({
      success: true,
      message: '미팅이 성공적으로 생성되었습니다.',
      data: {
        meeting: {
          ...meeting,
          preferred_dates: parsedDates
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('미팅 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '미팅 생성 중 오류가 발생했습니다.'
    });
  } finally {
    client.release();
  }
});

/**
 * @route   GET /api/matching/meetings
 * @desc    매칭 가능한 미팅 목록 조회
 * @access  Private
 */
router.get('/meetings', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { 
      region, 
      min_age, 
      max_age, 
      group_size, 
      page = 1, 
      limit = 10 
    } = req.query;

    let whereConditions = [`m.status = 'active'`, `m.leader_id != $1`];
    let queryParams = [user_id];
    let paramCount = 1;

    // 필터링 조건 추가
    if (region) {
      paramCount++;
      whereConditions.push(`m.preferred_region = $${paramCount}`);
      queryParams.push(region);
    }

    if (group_size) {
      paramCount++;
      whereConditions.push(`m.group_size = $${paramCount}`);
      queryParams.push(parseInt(group_size));
    }

    if (min_age) {
      paramCount++;
      whereConditions.push(`m.max_age >= $${paramCount}`);
      queryParams.push(parseInt(min_age));
    }

    if (max_age) {
      paramCount++;
      whereConditions.push(`m.min_age <= $${paramCount}`);
      queryParams.push(parseInt(max_age));
    }

    const offset = (page - 1) * limit;
    paramCount++;
    queryParams.push(parseInt(limit));
    paramCount++;
    queryParams.push(offset);

    const query = `
      SELECT 
        m.*,
        u.name as leader_name,
        u.age as leader_age,
        u.region as leader_region,
        u.profile_image_url as leader_profile_image,
        u.rating as leader_rating,
        (SELECT COUNT(*) FROM groume.meeting_member mm WHERE mm.meeting_id = m.id AND mm.is_confirmed = true) as confirmed_members_count
      FROM groume.meeting m
      JOIN groume.user u ON m.leader_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      AND m.expires_at > CURRENT_TIMESTAMP
      ORDER BY m.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await pool.query(query, queryParams);

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM groume.meeting m
      WHERE ${whereConditions.slice(0, -2).join(' AND ')}
      AND m.expires_at > CURRENT_TIMESTAMP
    `;
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    const meetings = result.rows.map(meeting => ({
      ...meeting,
      preferred_dates: meeting.preferred_dates ? JSON.parse(meeting.preferred_dates) : []
    }));

    res.json({
      success: true,
      data: {
        meetings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('미팅 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '미팅 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   POST /api/matching/requests
 * @desc    매칭 요청 보내기
 * @access  Private
 */
router.post('/requests', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { meeting_id, target_meeting_id, message } = req.body;
    const requester_id = req.user.id;

    // 입력 검증
    if (!meeting_id || !target_meeting_id) {
      return res.status(400).json({
        success: false,
        message: '미팅 ID를 모두 입력해주세요.'
      });
    }

    if (meeting_id === target_meeting_id) {
      return res.status(400).json({
        success: false,
        message: '자신의 미팅에는 매칭 요청을 보낼 수 없습니다.'
      });
    }

    await client.query('BEGIN');

    // 요청자가 해당 미팅의 리더인지 확인
    const meetingCheck = await client.query(
      'SELECT leader_id, status FROM groume.meeting WHERE id = $1',
      [meeting_id]
    );

    if (meetingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '요청하는 미팅을 찾을 수 없습니다.'
      });
    }

    if (meetingCheck.rows[0].leader_id !== requester_id) {
      return res.status(403).json({
        success: false,
        message: '미팅 리더만 매칭 요청을 보낼 수 있습니다.'
      });
    }

    if (meetingCheck.rows[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '활성화된 미팅만 매칭 요청을 보낼 수 있습니다.'
      });
    }

    // 대상 미팅 확인
    const targetMeetingCheck = await client.query(
      'SELECT leader_id, status FROM groume.meeting WHERE id = $1',
      [target_meeting_id]
    );

    if (targetMeetingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '요청받을 미팅을 찾을 수 없습니다.'
      });
    }

    if (targetMeetingCheck.rows[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '활성화된 미팅에만 매칭 요청을 보낼 수 있습니다.'
      });
    }

    // 이미 요청이 있는지 확인
    const existingRequest = await client.query(
      `SELECT id FROM groume.matching_request 
       WHERE meeting_id = $1 AND target_meeting_id = $2 AND status = 'pending'`,
      [meeting_id, target_meeting_id]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '이미 해당 미팅에 매칭 요청을 보냈습니다.'
      });
    }

    // 역방향 요청도 확인
    const reverseRequest = await client.query(
      `SELECT id FROM groume.matching_request 
       WHERE meeting_id = $1 AND target_meeting_id = $2 AND status = 'pending'`,
      [target_meeting_id, meeting_id]
    );

    if (reverseRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '상대방이 이미 매칭 요청을 보냈습니다.'
      });
    }

    // 매칭 요청 생성
    const requestResult = await client.query(
      `INSERT INTO groume.matching_request 
       (meeting_id, target_meeting_id, requester_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [meeting_id, target_meeting_id, requester_id, message]
    );

    // 알림 생성
    await client.query(
      `INSERT INTO groume.notification 
       (user_id, title, message, notification_type, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        targetMeetingCheck.rows[0].leader_id,
        '새로운 매칭 요청',
        '새로운 매칭 요청이 도착했습니다.',
        'matching',
        JSON.stringify({
          request_id: requestResult.rows[0].id,
          meeting_id: meeting_id,
          target_meeting_id: target_meeting_id
        })
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: '매칭 요청을 성공적으로 보냈습니다.',
      data: {
        request: requestResult.rows[0]
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('매칭 요청 오류:', error);
    res.status(500).json({
      success: false,
      message: '매칭 요청 중 오류가 발생했습니다.'
    });
  } finally {
    client.release();
  }
});

/**
 * @route   GET /api/matching/requests
 * @desc    받은/보낸 매칭 요청 목록 조회
 * @access  Private
 */
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { type = 'received', status, page = 1, limit = 10 } = req.query;

    let whereCondition = '';
    let queryParams = [user_id];

    if (type === 'received') {
      whereCondition = 'tm.leader_id = $1';
    } else if (type === 'sent') {
      whereCondition = 'mr.requester_id = $1';
    } else {
      return res.status(400).json({
        success: false,
        message: 'type은 received 또는 sent 중 하나여야 합니다.'
      });
    }

    if (status) {
      queryParams.push(status);
      whereCondition += ` AND mr.status = $${queryParams.length}`;
    }

    const offset = (page - 1) * limit;
    queryParams.push(parseInt(limit), offset);

    const query = `
      SELECT 
        mr.*,
        m.title as meeting_title,
        m.group_size as meeting_group_size,
        m.preferred_region as meeting_region,
        tm.title as target_meeting_title,
        tm.group_size as target_meeting_group_size,
        tm.preferred_region as target_meeting_region,
        u.name as requester_name,
        u.profile_image_url as requester_profile_image,
        tl.name as target_leader_name,
        tl.profile_image_url as target_leader_profile_image
      FROM groume.matching_request mr
      JOIN groume.meeting m ON mr.meeting_id = m.id
      JOIN groume.meeting tm ON mr.target_meeting_id = tm.id
      JOIN groume.user u ON mr.requester_id = u.id
      JOIN groume.user tl ON tm.leader_id = tl.id
      WHERE ${whereCondition}
      ORDER BY mr.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: {
        requests: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('매칭 요청 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '매칭 요청 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @route   PUT /api/matching/requests/:id/respond
 * @desc    매칭 요청에 응답하기 (수락/거절)
 * @access  Private
 */
router.put('/requests/:id/respond', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const user_id = req.user.id;

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'action은 accept 또는 reject 중 하나여야 합니다.'
      });
    }

    await client.query('BEGIN');

    // 매칭 요청 확인
    const requestCheck = await client.query(
      `SELECT mr.*, tm.leader_id 
       FROM groume.matching_request mr
       JOIN groume.meeting tm ON mr.target_meeting_id = tm.id
       WHERE mr.id = $1`,
      [id]
    );

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '매칭 요청을 찾을 수 없습니다.'
      });
    }

    const request = requestCheck.rows[0];

    // 권한 확인 (대상 미팅의 리더만 응답 가능)
    if (request.leader_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: '해당 매칭 요청에 응답할 권한이 없습니다.'
      });
    }

    // 이미 응답했는지 확인
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '이미 응답한 매칭 요청입니다.'
      });
    }

    let newStatus = action === 'accept' ? 'accepted' : 'rejected';

    // 매칭 요청 상태 업데이트
    await client.query(
      `UPDATE groume.matching_request 
       SET status = $1, responded_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newStatus, id]
    );

    // 수락한 경우 매칭 생성
    if (action === 'accept') {
      // 매칭된 미팅 생성
      const matchedMeetingResult = await client.query(
        `INSERT INTO groume.matched_meeting 
         (meeting1_id, meeting2_id)
         VALUES ($1, $2)
         RETURNING *`,
        [request.meeting_id, request.target_meeting_id]
      );

      // 채팅방 생성
      await client.query(
        `INSERT INTO groume.chat_room 
         (matched_meeting_id, name, type)
         VALUES ($1, $2, 'group')`,
        [matchedMeetingResult.rows[0].id, '매칭 채팅방']
      );

      // 미팅 상태를 'matched'로 업데이트
      await client.query(
        `UPDATE groume.meeting 
         SET status = 'matched'
         WHERE id IN ($1, $2)`,
        [request.meeting_id, request.target_meeting_id]
      );
    }

    // 요청자에게 알림 전송
    const notificationMessage = action === 'accept' 
      ? '매칭 요청이 수락되었습니다!' 
      : '매칭 요청이 거절되었습니다.';

    await client.query(
      `INSERT INTO groume.notification 
       (user_id, title, message, notification_type, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        request.requester_id,
        '매칭 요청 응답',
        notificationMessage,
        'matching',
        JSON.stringify({
          request_id: id,
          action: action,
          meeting_id: request.meeting_id,
          target_meeting_id: request.target_meeting_id
        })
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `매칭 요청을 ${action === 'accept' ? '수락' : '거절'}했습니다.`,
      data: {
        action: action,
        status: newStatus
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('매칭 요청 응답 오류:', error);
    res.status(500).json({
      success: false,
      message: '매칭 요청 응답 중 오류가 발생했습니다.'
    });
  } finally {
    client.release();
  }
});

/**
 * @route   GET /api/matching/my-meetings
 * @desc    내가 생성한 미팅 목록 조회
 * @access  Private
 */
router.get('/my-meetings', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    let whereConditions = ['m.leader_id = $1'];
    let queryParams = [user_id];

    if (status) {
      queryParams.push(status);
      whereConditions.push(`m.status = $${queryParams.length}`);
    }

    const offset = (page - 1) * limit;
    queryParams.push(parseInt(limit), offset);

    const query = `
      SELECT 
        m.*,
        (SELECT COUNT(*) FROM groume.meeting_member mm WHERE mm.meeting_id = m.id AND mm.is_confirmed = true) as confirmed_members_count,
        (SELECT COUNT(*) FROM groume.matching_request mr WHERE mr.meeting_id = m.id AND mr.status = 'pending') as pending_requests_count
      FROM groume.meeting m
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY m.created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const result = await pool.query(query, queryParams);

    const meetings = result.rows.map(meeting => ({
      ...meeting,
      preferred_dates: meeting.preferred_dates ? JSON.parse(meeting.preferred_dates) : []
    }));

    res.json({
      success: true,
      data: {
        meetings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('내 미팅 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '미팅 목록을 불러오는 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
