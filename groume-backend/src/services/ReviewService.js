const { query, transaction } = require('../config/database');

class ReviewService {
  /**
   * 리뷰 생성 (트리거 대신 백엔드에서 평점 업데이트)
   */
  async createReview(reviewData) {
    const { reviewer_id, reviewee_id, matched_meeting_id, rating, comment } = reviewData;

    return await transaction(async (client) => {
      // 1. 리뷰 생성
      const reviewResult = await client.query(`
        INSERT INTO review (reviewer_id, reviewee_id, matched_meeting_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [reviewer_id, reviewee_id, matched_meeting_id, rating, comment]);

      const review = reviewResult.rows[0];

      // 2. 사용자 평점 업데이트 (트리거 대신 백엔드에서 처리)
      await this.updateUserRating(reviewee_id, client);

      console.log(`✅ 리뷰 생성 완료: 사용자 ${reviewee_id}의 평점 업데이트됨`);
      return review;
    });
  }

  /**
   * 사용자 평점 업데이트 (트리거 로직을 백엔드로 이전)
   */
  async updateUserRating(userId, client = null) {
    const executeQuery = client ? 
      (text, params) => client.query(text, params) : 
      query;

    // 평점 통계 계산
    const statsResult = await executeQuery(`
      SELECT 
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(*) as rating_count
      FROM review 
      WHERE reviewee_id = $1
    `, [userId]);

    const { avg_rating, rating_count } = statsResult.rows[0];

    // 사용자 테이블 업데이트
    await executeQuery(`
      UPDATE "user" 
      SET 
        rating = $1,
        rating_count = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [parseFloat(avg_rating), parseInt(rating_count), userId]);

    console.log(`✅ 사용자 ${userId} 평점 업데이트: ${avg_rating} (${rating_count}개 리뷰)`);
    
    return { rating: parseFloat(avg_rating), rating_count: parseInt(rating_count) };
  }

  /**
   * 특정 매칭에 대한 리뷰 조회
   */
  async getReviewsByMatching(matchedMeetingId) {
    const result = await query(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewee.name as reviewee_name
      FROM review r
      LEFT JOIN "user" reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN "user" reviewee ON r.reviewee_id = reviewee.id
      WHERE r.matched_meeting_id = $1
      ORDER BY r.created_at DESC
    `, [matchedMeetingId]);

    return result.rows;
  }

  /**
   * 사용자가 받은 리뷰 조회
   */
  async getReceivedReviews(userId, limit = 10, offset = 0) {
    const result = await query(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.profile_image_url as reviewer_image
      FROM review r
      LEFT JOIN "user" reviewer ON r.reviewer_id = reviewer.id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    return result.rows;
  }

  /**
   * 리뷰 삭제 (평점 재계산 포함)
   */
  async deleteReview(reviewId, userId) {
    return await transaction(async (client) => {
      // 리뷰 조회 (권한 확인용)
      const reviewResult = await client.query(`
        SELECT * FROM review WHERE id = $1 AND reviewer_id = $2
      `, [reviewId, userId]);

      if (reviewResult.rows.length === 0) {
        throw new Error('리뷰를 찾을 수 없거나 삭제 권한이 없습니다.');
      }

      const review = reviewResult.rows[0];

      // 리뷰 삭제
      await client.query('DELETE FROM review WHERE id = $1', [reviewId]);

      // 평점 재계산
      await this.updateUserRating(review.reviewee_id, client);

      console.log(`✅ 리뷰 삭제 완료: ${reviewId}`);
      return { message: '리뷰가 삭제되었습니다.' };
    });
  }
}

module.exports = new ReviewService();
