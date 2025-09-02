const { query, transaction } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UserService {
  /**
   * 사용자 회원가입
   */
  async register(userData) {
    const { username, email, password, name, age, gender, region, phone, bio, interests } = userData;

    return await transaction(async (client) => {
      // 중복 확인
      const existingUser = await client.query(`
        SELECT id FROM "user" WHERE username = $1 OR email = $2
      `, [username, email]);

      if (existingUser.rows.length > 0) {
        throw new Error('이미 존재하는 사용자명 또는 이메일입니다.');
      }

      // 비밀번호 해싱
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 사용자 생성
      const userResult = await client.query(`
        INSERT INTO "user" (
          username, email, password_hash, name, age, gender, region, 
          phone, bio, interests, ticket_count, rating, rating_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0.00, 0)
        RETURNING id, username, email, name, age, gender, region, phone, bio, interests, 
                  ticket_count, rating, rating_count, created_at
      `, [username, email, passwordHash, name, age, gender, region, phone, bio, JSON.stringify(interests || [])]);

      const user = userResult.rows[0];

      // 회원가입 환영 티켓 지급 (별도 서비스에서 처리)
      console.log(`✅ 새 사용자 가입: ${username} (ID: ${user.id})`);
      
      return user;
    });
  }

  /**
   * 사용자 로그인
   */
  async login(username, password) {
    // 사용자 조회
    const userResult = await query(`
      SELECT * FROM "user" 
      WHERE (username = $1 OR email = $1) AND is_active = true
    `, [username]);

    if (userResult.rows.length === 0) {
      throw new Error('존재하지 않는 사용자이거나 비활성화된 계정입니다.');
    }

    const user = userResult.rows[0];

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    // 마지막 로그인 시간 업데이트
    await query(`
      UPDATE "user" 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [user.id]);

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // 민감한 정보 제거
    const { password_hash, ...userWithoutPassword } = user;

    console.log(`✅ 사용자 로그인: ${username} (ID: ${user.id})`);

    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * 사용자 프로필 조회
   */
  async getProfile(userId) {
    const result = await query(`
      SELECT 
        id, username, email, name, age, gender, region, phone, 
        profile_image_url, bio, interests, ticket_count, rating, 
        rating_count, created_at, updated_at, last_login
      FROM "user" 
      WHERE id = $1 AND is_active = true
    `, [userId]);

    if (result.rows.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    return result.rows[0];
  }

  /**
   * 사용자 프로필 업데이트
   */
  async updateProfile(userId, updateData) {
    const allowedFields = ['name', 'age', 'region', 'phone', 'profile_image_url', 'bio', 'interests'];
    const updates = [];
    const values = [];
    let valueIndex = 1;

    // 업데이트할 필드만 선택
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${valueIndex}`);
        values.push(key === 'interests' ? JSON.stringify(value) : value);
        valueIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('업데이트할 필드가 없습니다.');
    }

    // updated_at 자동 업데이트
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const result = await query(`
      UPDATE "user" 
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex} AND is_active = true
      RETURNING id, username, email, name, age, gender, region, phone, 
                profile_image_url, bio, interests, ticket_count, rating, 
                rating_count, created_at, updated_at
    `, values);

    if (result.rows.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    console.log(`✅ 사용자 프로필 업데이트: ${userId}`);
    return result.rows[0];
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(userId, currentPassword, newPassword) {
    return await transaction(async (client) => {
      // 현재 비밀번호 확인
      const userResult = await client.query(`
        SELECT password_hash FROM "user" WHERE id = $1 AND is_active = true
      `, [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isValidPassword) {
        throw new Error('현재 비밀번호가 일치하지 않습니다.');
      }

      // 새 비밀번호 해싱
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 비밀번호 업데이트
      await client.query(`
        UPDATE "user" 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [newPasswordHash, userId]);

      console.log(`✅ 비밀번호 변경 완료: ${userId}`);
      return { message: '비밀번호가 성공적으로 변경되었습니다.' };
    });
  }

  /**
   * 사용자 검색 (매칭용)
   */
  async searchUsers(filters = {}) {
    const { age_min, age_max, gender, region, interests, limit = 20, offset = 0 } = filters;
    
    let whereConditions = ['is_active = true'];
    const values = [];
    let valueIndex = 1;

    if (age_min) {
      whereConditions.push(`age >= $${valueIndex}`);
      values.push(age_min);
      valueIndex++;
    }

    if (age_max) {
      whereConditions.push(`age <= $${valueIndex}`);
      values.push(age_max);
      valueIndex++;
    }

    if (gender) {
      whereConditions.push(`gender = $${valueIndex}`);
      values.push(gender);
      valueIndex++;
    }

    if (region) {
      whereConditions.push(`region = $${valueIndex}`);
      values.push(region);
      valueIndex++;
    }

    if (interests && interests.length > 0) {
      whereConditions.push(`interests::jsonb ?| $${valueIndex}`);
      values.push(interests);
      valueIndex++;
    }

    values.push(limit, offset);

    const result = await query(`
      SELECT 
        id, username, name, age, gender, region, profile_image_url, 
        bio, interests, rating, rating_count
      FROM "user" 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY rating DESC, rating_count DESC
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `, values);

    return result.rows;
  }
}

module.exports = new UserService();
