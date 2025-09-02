const UserService = require('../services/UserService');
const TicketService = require('../services/TicketService');
const Joi = require('joi');

// 회원가입 검증 스키마
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  name: Joi.string().min(2).max(100).required(),
  age: Joi.number().integer().min(18).max(100).required(),
  gender: Joi.string().valid('male', 'female').required(),
  region: Joi.string().max(50).required(),
  phone: Joi.string().max(20).optional(),
  bio: Joi.string().max(1000).optional(),
  interests: Joi.array().items(Joi.string()).optional()
});

// 로그인 검증 스키마
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

class AuthController {
  /**
   * 회원가입
   */
  async register(req, res) {
    try {
      // 입력 데이터 검증
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다.',
          errors: error.details.map(detail => detail.message)
        });
      }

      // 사용자 생성
      const user = await UserService.register(value);

      // 회원가입 환영 티켓 지급
      await TicketService.issueTicket({
        user_id: user.id,
        ticket_type: 'bonus',
        amount: 5,
        source: 'welcome_bonus',
        description: '회원가입 환영 티켓',
        expires_at: null
      });

      // JWT 토큰 생성 (회원가입 시에도 자동 로그인)
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.status(201).json({
        success: true,
        message: '회원가입이 완료되었습니다. 환영 티켓 5개가 지급되었습니다!',
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
          ticket_count: user.ticket_count,
          rating: user.rating,
          rating_count: user.rating_count,
          created_at: user.created_at
        },
        token: token
      });

    } catch (error) {
      console.error('회원가입 에러:', error);
      res.status(400).json({
        success: false,
        message: error.message || '회원가입 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 로그인
   */
  async login(req, res) {
    try {
      // 입력 데이터 검증
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '사용자명과 비밀번호를 입력해주세요.',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { username, password } = value;

      // 로그인 처리
      const result = await UserService.login(username, password);

      res.json({
        success: true,
        message: '로그인이 완료되었습니다.',
        data: result
      });

    } catch (error) {
      console.error('로그인 에러:', error);
      res.status(401).json({
        success: false,
        message: error.message || '로그인 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 내 프로필 조회
   */
  async getMyProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await UserService.getProfile(userId);

      res.json({
        success: true,
        data: { user: profile }
      });

    } catch (error) {
      console.error('프로필 조회 에러:', error);
      res.status(404).json({
        success: false,
        message: error.message || '프로필 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 프로필 업데이트
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updateData = req.body;

      const updatedProfile = await UserService.updateProfile(userId, updateData);

      res.json({
        success: true,
        message: '프로필이 성공적으로 업데이트되었습니다.',
        data: { user: updatedProfile }
      });

    } catch (error) {
      console.error('프로필 업데이트 에러:', error);
      res.status(400).json({
        success: false,
        message: error.message || '프로필 업데이트 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: '새 비밀번호는 최소 6자 이상이어야 합니다.'
        });
      }

      const result = await UserService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('비밀번호 변경 에러:', error);
      res.status(400).json({
        success: false,
        message: error.message || '비밀번호 변경 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = new AuthController();
