const { query, transaction } = require('../config/database');

class TicketService {
  /**
   * 티켓 지급 (트리거 대신 백엔드에서 사용자 티켓 개수 업데이트)
   */
  async issueTicket(ticketData) {
    const { user_id, ticket_type, amount, source, description, expires_at } = ticketData;

    return await transaction(async (client) => {
      // 1. 티켓 생성
      const ticketResult = await client.query(`
        INSERT INTO ticket (user_id, ticket_type, amount, source, description, expires_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [user_id, ticket_type, amount, source, description, expires_at]);

      const ticket = ticketResult.rows[0];

      // 2. 사용자 티켓 개수 업데이트 (트리거 대신 백엔드에서 처리)
      await this.updateUserTicketCount(user_id, client);

      console.log(`✅ 티켓 지급 완료: 사용자 ${user_id}에게 ${amount}개 티켓 지급`);
      return ticket;
    });
  }

  /**
   * 티켓 사용 (트리거 대신 백엔드에서 처리)
   */
  async useTicket(userId, amount, purpose) {
    return await transaction(async (client) => {
      // 1. 사용 가능한 티켓 조회 (만료되지 않고 사용되지 않은 티켓)
      const availableTicketsResult = await client.query(`
        SELECT * FROM ticket 
        WHERE user_id = $1 
          AND is_used = false 
          AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        ORDER BY created_at ASC
      `, [userId]);

      const availableTickets = availableTicketsResult.rows;
      const totalAvailable = availableTickets.reduce((sum, ticket) => sum + ticket.amount, 0);

      if (totalAvailable < amount) {
        throw new Error(`사용 가능한 티켓이 부족합니다. (보유: ${totalAvailable}, 필요: ${amount})`);
      }

      // 2. 필요한 만큼 티켓 사용 처리
      let remainingAmount = amount;
      const usedTickets = [];

      for (const ticket of availableTickets) {
        if (remainingAmount <= 0) break;

        if (ticket.amount <= remainingAmount) {
          // 티켓 전체 사용
          await client.query(`
            UPDATE ticket 
            SET is_used = true, used_at = CURRENT_TIMESTAMP 
            WHERE id = $1
          `, [ticket.id]);

          usedTickets.push(ticket);
          remainingAmount -= ticket.amount;
        } else {
          // 티켓 부분 사용 (원본은 사용 처리, 잔여분으로 새 티켓 생성)
          await client.query(`
            UPDATE ticket 
            SET is_used = true, used_at = CURRENT_TIMESTAMP 
            WHERE id = $1
          `, [ticket.id]);

          // 잔여분 새 티켓 생성
          await client.query(`
            INSERT INTO ticket (user_id, ticket_type, amount, source, description, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            userId, 
            ticket.ticket_type, 
            ticket.amount - remainingAmount,
            `잔여분 (원본: ${ticket.id})`,
            ticket.description,
            ticket.expires_at
          ]);

          usedTickets.push({...ticket, amount: remainingAmount});
          remainingAmount = 0;
        }
      }

      // 3. 사용자 티켓 개수 업데이트
      await this.updateUserTicketCount(userId, client);

      console.log(`✅ 티켓 사용 완료: 사용자 ${userId}가 ${amount}개 티켓 사용 (${purpose})`);
      
      return {
        used_amount: amount,
        used_tickets: usedTickets,
        purpose: purpose
      };
    });
  }

  /**
   * 사용자 티켓 개수 업데이트 (트리거 로직을 백엔드로 이전)
   */
  async updateUserTicketCount(userId, client = null) {
    const executeQuery = client ? 
      (text, params) => client.query(text, params) : 
      query;

    // 사용 가능한 티켓 개수 계산
    const countResult = await executeQuery(`
      SELECT COALESCE(SUM(amount), 0) as total_tickets
      FROM ticket 
      WHERE user_id = $1 
        AND is_used = false 
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `, [userId]);

    const totalTickets = parseInt(countResult.rows[0].total_tickets);

    // 사용자 테이블 업데이트
    await executeQuery(`
      UPDATE "user" 
      SET 
        ticket_count = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [totalTickets, userId]);

    console.log(`✅ 사용자 ${userId} 티켓 개수 업데이트: ${totalTickets}개`);
    return totalTickets;
  }

  /**
   * 사용자 티켓 내역 조회
   */
  async getUserTickets(userId, includeUsed = false) {
    const whereClause = includeUsed ? 
      'WHERE user_id = $1' : 
      'WHERE user_id = $1 AND is_used = false AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)';

    const result = await query(`
      SELECT * FROM ticket 
      ${whereClause}
      ORDER BY created_at DESC
    `, [userId]);

    return result.rows;
  }

  /**
   * 만료된 티켓 정리 (배치 작업용)
   */
  async cleanupExpiredTickets() {
    return await transaction(async (client) => {
      // 만료된 티켓 조회
      const expiredResult = await client.query(`
        SELECT DISTINCT user_id FROM ticket 
        WHERE expires_at <= CURRENT_TIMESTAMP AND is_used = false
      `);

      const affectedUsers = expiredResult.rows.map(row => row.user_id);

      // 만료된 티켓 사용 처리
      const cleanupResult = await client.query(`
        UPDATE ticket 
        SET is_used = true, used_at = CURRENT_TIMESTAMP 
        WHERE expires_at <= CURRENT_TIMESTAMP AND is_used = false
      `);

      // 영향받은 사용자들의 티켓 개수 업데이트
      for (const userId of affectedUsers) {
        await this.updateUserTicketCount(userId, client);
      }

      console.log(`✅ 만료된 티켓 정리 완료: ${cleanupResult.rowCount}개 티켓, ${affectedUsers.length}명 사용자 영향`);
      
      return {
        cleaned_tickets: cleanupResult.rowCount,
        affected_users: affectedUsers.length
      };
    });
  }

  /**
   * 미션 완료 시 티켓 지급
   */
  async issueMissionReward(userId, missionId, rewardAmount) {
    return await this.issueTicket({
      user_id: userId,
      ticket_type: 'mission',
      amount: rewardAmount,
      source: `mission_${missionId}`,
      description: '미션 완료 보상',
      expires_at: null // 미션 보상은 만료 없음
    });
  }
}

module.exports = new TicketService();
