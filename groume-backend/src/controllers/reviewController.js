const ReviewService = require('../services/ReviewService');
const Joi = require('joi');

// 리뷰 생성 검증 스키마
const createReviewSchema = Joi.object({
  reviewee_id: Joi.number().integer().required(),
  matched_meeting_id: Joi.number().integer().required(),
  rating: Joi.number().min(1).max(5).precision(2).required(),
  comment: Joi.string().max(1000).optional()
});

class ReviewController {
  /**
   * 리뷰 생성 (트리거 대신 백엔드에서 평점 업데이트 처리)
   */
  async createReview(req, res) {
    try {
      // 입력 데이터 검증
      const { error, value } = createReviewSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '입력 데이터가 올바르지 않습니다.',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { reviewee_id, matched_meeting_id, rating, comment } = value;
      const reviewer_id = req.user.userId;

      // 자기 자신 리뷰 방지
      if (reviewer_id === reviewee_id) {
        return res.status(400).json({
          success: false,
          message: '자기 자신에게는 리뷰를 작성할 수 없습니다.'
        });
      }

      // 리뷰 생성 (백엔드에서 평점 자동 업데이트)
      const review = await ReviewService.createReview({
        reviewer_id,
        reviewee_id,
        matched_meeting_id,
        rating,
        comment
      });

      res.status(201).json({
        success: true,
        message: '리뷰가 성공적으로 작성되었습니다. 상대방의 평점이 업데이트되었습니다.',
        data: { review }
      });

    } catch (error) {
      console.error('리뷰 생성 에러:', error);
      
      if (error.message.includes('duplicate')) {
        return res.status(409).json({
          success: false,
          message: '이미 해당 매칭에 대한 리뷰를 작성하셨습니다.'
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || '리뷰 작성 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 특정 매칭의 리뷰 조회
   */
  async getReviewsByMatching(req, res) {
    try {
      const { matchedMeetingId } = req.params;

      if (!matchedMeetingId || isNaN(matchedMeetingId)) {
        return res.status(400).json({
          success: false,
          message: '올바른 매칭 ID를 입력해주세요.'
        });
      }

      const reviews = await ReviewService.getReviewsByMatching(parseInt(matchedMeetingId));

      res.json({
        success: true,
        data: { reviews }
      });

    } catch (error) {
      console.error('매칭 리뷰 조회 에러:', error);
      res.status(500).json({
        success: false,
        message: '리뷰 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 내가 받은 리뷰 조회
   */
  async getReceivedReviews(req, res) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const reviews = await ReviewService.getReceivedReviews(userId, limit, offset);

      res.json({
        success: true,
        data: { 
          reviews,
          pagination: {
            limit,
            offset,
            count: reviews.length
          }
        }
      });

    } catch (error) {
      console.error('받은 리뷰 조회 에러:', error);
      res.status(500).json({
        success: false,
        message: '리뷰 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 특정 사용자의 리뷰 조회 (공개 프로필용)
   */
  async getUserReviews(req, res) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: '올바른 사용자 ID를 입력해주세요.'
        });
      }

      const reviews = await ReviewService.getReceivedReviews(parseInt(userId), limit, offset);

      res.json({
        success: true,
        data: { 
          reviews,
          pagination: {
            limit,
            offset,
            count: reviews.length
          }
        }
      });

    } catch (error) {
      console.error('사용자 리뷰 조회 에러:', error);
      res.status(500).json({
        success: false,
        message: '리뷰 조회 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 리뷰 삭제 (평점 재계산 포함)
   */
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;
      const userId = req.user.userId;

      if (!reviewId || isNaN(reviewId)) {
        return res.status(400).json({
          success: false,
          message: '올바른 리뷰 ID를 입력해주세요.'
        });
      }

      const result = await ReviewService.deleteReview(parseInt(reviewId), userId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('리뷰 삭제 에러:', error);
      res.status(400).json({
        success: false,
        message: error.message || '리뷰 삭제 중 오류가 발생했습니다.'
      });
    }
  }

  /**
   * 사용자 평점 수동 재계산 (관리자용)
   */
  async recalculateUserRating(req, res) {
    try {
      const { userId } = req.params;

      if (!userId || isNaN(userId)) {
        return res.status(400).json({
          success: false,
          message: '올바른 사용자 ID를 입력해주세요.'
        });
      }

      const result = await ReviewService.updateUserRating(parseInt(userId));

      res.json({
        success: true,
        message: '사용자 평점이 재계산되었습니다.',
        data: result
      });

    } catch (error) {
      console.error('평점 재계산 에러:', error);
      res.status(500).json({
        success: false,
        message: '평점 재계산 중 오류가 발생했습니다.'
      });
    }
  }
}

module.exports = new ReviewController();
