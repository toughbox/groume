const TicketService = require('../services/TicketService');
const Joi = require('joi');

// 티켓 지급 검증 스키마
const issueTicketSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  ticket_type: Joi.string().valid('meeting', 'bonus', 'mission').required(),
  amount: Joi.number().integer().min(1).required(),
  source: Joi.string().max(50).required(),
  description: Joi.string().max(500).optional(),
  expires_at: Joi.date().optional()
});

// 티켓 사용 검증 스키마
const useTicketSchema = Joi.object({
  amount: Joi.number().integer().min(1).required(),
  purpose: Joi.string().max(100).required()
});

class TicketController {
  /**
   * 내 티켓 내역 조회
   */
  async getMyTickets(req, res) {
    try {
      const userId = req.user.userId;
      const includeUsed = req.query.include_used === 'true';

      const tickets = await TicketService.getUserTickets(userId, includeUsed);

      res.json({
        success: true,
        data: { tickets }
      });

    } catch (error) {
      console.error('티켓 조회 에러:', error);
      res.status(500).json({
        success: false,
        message: '티켓 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 티켓 사용 (트리거 대신 백엔드에서 개수 업데이트)
   */
  async useTicket(req, res) {
    try {
      // 입력 데이터 검증
      const { error, value } = useTicketSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다.',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { amount, purpose } = value;
      const userId = req.user.userId;

      // 티켓 사용 처리 (백엔드에서 사용자 티켓 개수 자동 업데이트)
      const result = await TicketService.useTicket(userId, amount, purpose);

      res.json({
        success: true,
        message: `티켓 ${amount}개가 사용되었습니다. (${purpose})`,
        data: result
      });

    } catch (error) {
      console.error('티켓 사용 에러:', error);
      res.status(400).json({
        success: false,
        message: error.message || '티켓 사용 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 티켓 지급 (관리자용)
   */
  async issueTicket(req, res) {
    try {
      // 입력 데이터 검증
      const { error, value } = issueTicketSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다.',
          errors: error.details.map(detail => detail.message)
        });
      }

      // 티켓 지급 (백엔드에서 사용자 티켓 개수 자동 업데이트)
      const ticket = await TicketService.issueTicket(value);

      res.status(201).json({
        success: true,
        message: '티켓이 성공적으로 지급되었습니다.',
        data: { ticket }
      });

    } catch (error) {
      console.error('티켓 지급 에러:', error);
      res.status(400).json({
        success: false,
        message: error.message || '티켓 지급 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 미션 완료 시 티켓 지급
   */
  async issueMissionReward(req, res) {
    try {
      const { missionId, rewardAmount } = req.body;
      const userId = req.user.userId;

      if (!missionId || !rewardAmount || rewardAmount < 1) {
        return res.status(400).json({
          success: false,
          message: '올바른 미션 ID와 보상 개수를 입력해주세요.'
        });
      }

      const ticket = await TicketService.issueMissionReward(userId, missionId, rewardAmount);

      res.status(201).json({
        success: true,
        message: `미션 완료 보상으로 티켓 ${rewardAmount}개가 지급되었습니다!`,
        data: { ticket }
      });

    } catch (error) {
      console.error('미션 보상 지급 에러:', error);
      res.status(400).json({
        success: false,
        message: error.message || '미션 보상 지급 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 사용자 티켓 개수 수동 재계산 (관리자용)
   */
  async recalculateUserTickets(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: '올바른 사용자 ID를 입력해주세요.'
        });
      }

      const totalTickets = await TicketService.updateUserTicketCount(parseInt(userId));

      res.json({
        success: true,
        message: '사용자 티켓 개수가 재계산되었습니다.',
        data: { total_tickets: totalTickets }
      });

    } catch (error) {
      console.error('티켓 개수 재계산 에러:', error);
      res.status(500).json({
        success: false,
        message: '티켓 개수 재계산 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 만료된 티켓 정리 (관리자용)
   */
  async cleanupExpiredTickets(req, res) {
    try {
      const result = await TicketService.cleanupExpiredTickets();

      res.json({
        success: true,
        message: '만료된 티켓 정리가 완료되었습니다.',
        data: result
      });

    } catch (error) {
      console.error('만료 티켓 정리 에러:', error);
      res.status(500).json({
        success: false,
        message: '만료 티켓 정리 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 특정 사용자의 티켓 내역 조회 (관리자용)
   */
  async getUserTickets(req, res) {
    try {
      const { userId } = req.params;
      const includeUsed = req.query.include_used === 'true';

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: '올바른 사용자 ID를 입력해주세요.'
        });
      }

      const tickets = await TicketService.getUserTickets(parseInt(userId), includeUsed);

      res.json({
        success: true,
        data: { 
          user_id: parseInt(userId),
          tickets 
        }
      });

    } catch (error) {
      console.error('사용자 티켓 조회 에러:', error);
      res.status(500).json({
        success: false,
        message: '티켓 조회 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = new TicketController();
