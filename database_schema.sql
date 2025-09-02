-- 그루미 앱 PostgreSQL 데이터베이스 스키마
-- 생성일: 2024년

-- groume 스키마 생성
CREATE SCHEMA IF NOT EXISTS groume;

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 사용자 테이블
CREATE TABLE groume.user (
    id BIGSERIAL PRIMARY KEY,                                            -- 사용자 고유 ID
    username VARCHAR(50) UNIQUE NOT NULL,                               -- 로그인 아이디 (유니크)
    email VARCHAR(100) UNIQUE NOT NULL,                                 -- 이메일 주소 (유니크)
    password_hash VARCHAR(255) NOT NULL,                                -- 암호화된 비밀번호
    name VARCHAR(100) NOT NULL,                                         -- 실명
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),             -- 나이 (18세 이상)
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),  -- 성별 (남성/여성)
    region VARCHAR(50) NOT NULL,                                        -- 거주 지역
    phone VARCHAR(20),                                                  -- 전화번호 (선택)
    profile_image_url TEXT,                                             -- 프로필 이미지 URL
    bio TEXT,                                                           -- 자기소개
    interests JSONB DEFAULT '[]',                                       -- 관심사 배열 (JSON)
    ticket_count INTEGER DEFAULT 0 CHECK (ticket_count >= 0),          -- 보유 매칭 티켓 수
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5), -- 평균 평점 (1-5점)
    rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),          -- 받은 평가 수
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,     -- 계정 생성일
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,     -- 마지막 수정일
    last_login TIMESTAMP WITH TIME ZONE,                               -- 마지막 로그인 시간
    is_active BOOLEAN DEFAULT true                                     -- 계정 활성화 상태
);

-- 미팅 테이블
CREATE TABLE groume.meeting (
    id BIGSERIAL PRIMARY KEY,                                           -- 미팅 고유 ID
    title VARCHAR(200) NOT NULL,                                       -- 미팅 제목
    description TEXT,                                                   -- 미팅 설명
    leader_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE,  -- 미팅 주최자 ID
    group_size INTEGER NOT NULL CHECK (group_size >= 2 AND group_size <= 10), -- 그룹 크기 (2-10명)
    min_age INTEGER NOT NULL CHECK (min_age >= 18),                    -- 선호 최소 나이
    max_age INTEGER NOT NULL CHECK (max_age >= min_age),               -- 선호 최대 나이
    preferred_region VARCHAR(50) NOT NULL,                             -- 선호 지역
    meeting_place VARCHAR(50) NOT NULL,                                -- 미팅 장소 (카페, 식당, 술집 등)
    preferred_dates JSONB DEFAULT '[]',                                -- 선호 날짜 배열 (JSON)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'completed', 'cancelled', 'expired')), -- 미팅 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 생성일
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 수정일
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days') -- 만료일 (7일 후)
);

-- 미팅 참가자 테이블
CREATE TABLE groume.meeting_member (
    id BIGSERIAL PRIMARY KEY,                                           -- 참가자 고유 ID
    meeting_id BIGINT NOT NULL REFERENCES groume.meeting(id) ON DELETE CASCADE, -- 미팅 ID
    user_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE,    -- 참가자 사용자 ID
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member')), -- 역할 (리더/멤버)
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,     -- 참가 일시
    is_confirmed BOOLEAN DEFAULT false,                                -- 참가 확정 여부
    UNIQUE(meeting_id, user_id)                                       -- 한 미팅에 한 명만 참가 가능
);

-- 매칭 요청 테이블
CREATE TABLE groume.matching_request (
    id BIGSERIAL PRIMARY KEY,                                           -- 매칭 요청 고유 ID
    meeting_id BIGINT NOT NULL REFERENCES groume.meeting(id) ON DELETE CASCADE, -- 요청하는 미팅 ID
    target_meeting_id BIGINT NOT NULL REFERENCES groume.meeting(id) ON DELETE CASCADE, -- 요청받는 미팅 ID
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')), -- 요청 상태
    requester_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE, -- 요청자 사용자 ID
    message TEXT,                                                      -- 요청 메시지
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 요청 일시
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'), -- 만료 일시 (24시간 후)
    responded_at TIMESTAMP WITH TIME ZONE,                            -- 응답 일시
    CHECK (meeting_id != target_meeting_id)                           -- 자기 자신에게 요청 불가
);

-- 매칭된 미팅 테이블
CREATE TABLE groume.matched_meeting (
    id BIGSERIAL PRIMARY KEY,                                           -- 매칭 고유 ID
    meeting1_id BIGINT NOT NULL REFERENCES groume.meeting(id) ON DELETE CASCADE, -- 첫 번째 미팅 ID
    meeting2_id BIGINT NOT NULL REFERENCES groume.meeting(id) ON DELETE CASCADE, -- 두 번째 미팅 ID
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 매칭 성사 일시
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')), -- 매칭 상태
    meeting_location TEXT,                                             -- 실제 만날 장소
    meeting_datetime TIMESTAMP WITH TIME ZONE,                        -- 실제 만날 날짜/시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 생성일
    CHECK (meeting1_id != meeting2_id),                               -- 동일한 미팅끼리 매칭 불가
    UNIQUE(meeting1_id, meeting2_id)                                  -- 동일한 매칭 중복 방지
);

-- 채팅방 테이블
CREATE TABLE groume.chat_room (
    id BIGSERIAL PRIMARY KEY,                                           -- 채팅방 고유 ID
    matched_meeting_id BIGINT NOT NULL REFERENCES groume.matched_meeting(id) ON DELETE CASCADE, -- 매칭된 미팅 ID
    name VARCHAR(200),                                                 -- 채팅방 이름
    type VARCHAR(20) DEFAULT 'group' CHECK (type IN ('group', 'private')), -- 채팅방 타입 (그룹/개인)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 채팅방 생성일
    last_message_at TIMESTAMP WITH TIME ZONE,                         -- 마지막 메시지 시간
    is_active BOOLEAN DEFAULT true                                    -- 채팅방 활성화 상태
);

-- 메시지 테이블
CREATE TABLE groume.message (
    id BIGSERIAL PRIMARY KEY,                                           -- 메시지 고유 ID
    chat_room_id BIGINT NOT NULL REFERENCES groume.chat_room(id) ON DELETE CASCADE, -- 채팅방 ID
    sender_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE,  -- 발신자 사용자 ID
    content TEXT NOT NULL,                                             -- 메시지 내용
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')), -- 메시지 타입
    metadata JSONB DEFAULT '{}',                                       -- 메시지 메타데이터 (JSON)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 메시지 전송 시간
    is_deleted BOOLEAN DEFAULT false,                                 -- 삭제 여부
    read_at TIMESTAMP WITH TIME ZONE                                  -- 읽음 시간
);

-- 티켓 테이블
CREATE TABLE groume.ticket (
    id BIGSERIAL PRIMARY KEY,                                           -- 티켓 고유 ID
    user_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE,    -- 티켓 소유자 사용자 ID
    ticket_type VARCHAR(20) DEFAULT 'meeting' CHECK (ticket_type IN ('meeting', 'bonus', 'mission')), -- 티켓 타입
    amount INTEGER NOT NULL CHECK (amount > 0),                       -- 티켓 개수
    source VARCHAR(50) NOT NULL,                                      -- 티켓 획득 출처
    description TEXT,                                                  -- 티켓 설명
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 티켓 획득 일시
    expires_at TIMESTAMP WITH TIME ZONE,                              -- 티켓 만료 일시
    is_used BOOLEAN DEFAULT false,                                    -- 사용 여부
    used_at TIMESTAMP WITH TIME ZONE                                  -- 사용 일시
);

-- 미션 테이블
CREATE TABLE groume.mission (
    id BIGSERIAL PRIMARY KEY,                                           -- 미션 고유 ID
    title VARCHAR(200) NOT NULL,                                       -- 미션 제목
    description TEXT NOT NULL,                                         -- 미션 설명
    mission_type VARCHAR(20) NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'special', 'achievement')), -- 미션 타입
    reward_tickets INTEGER NOT NULL CHECK (reward_tickets > 0),       -- 보상 티켓 수
    requirements JSONB NOT NULL DEFAULT '{}',                          -- 미션 요구사항 (JSON)
    is_active BOOLEAN DEFAULT true,                                   -- 미션 활성화 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP     -- 미션 생성일
);

-- 사용자 미션 테이블
CREATE TABLE groume.user_mission (
    id BIGSERIAL PRIMARY KEY,                                           -- 사용자 미션 고유 ID
    user_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE,    -- 사용자 ID
    mission_id BIGINT NOT NULL REFERENCES groume.mission(id) ON DELETE CASCADE, -- 미션 ID
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'claimed')), -- 미션 상태
    progress INTEGER DEFAULT 0 CHECK (progress >= 0),                 -- 현재 진행도
    max_progress INTEGER NOT NULL CHECK (max_progress > 0),           -- 목표 진행도
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 미션 시작 일시
    completed_at TIMESTAMP WITH TIME ZONE,                            -- 미션 완료 일시
    claimed_at TIMESTAMP WITH TIME ZONE,                              -- 보상 수령 일시
    UNIQUE(user_id, mission_id)                                       -- 사용자별 미션 중복 방지
);

-- 리뷰 테이블
CREATE TABLE groume.review (
    id BIGSERIAL PRIMARY KEY,                                           -- 리뷰 고유 ID
    reviewer_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE, -- 리뷰 작성자 사용자 ID
    reviewee_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE, -- 리뷰 대상자 사용자 ID
    matched_meeting_id BIGINT NOT NULL REFERENCES groume.matched_meeting(id) ON DELETE CASCADE, -- 매칭된 미팅 ID
    rating DECIMAL(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 평점 (1-5점)
    comment TEXT,                                                      -- 리뷰 코멘트
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 리뷰 작성 일시
    CHECK (reviewer_id != reviewee_id),                               -- 자기 자신 리뷰 불가
    UNIQUE(reviewer_id, reviewee_id, matched_meeting_id)              -- 매칭별 중복 리뷰 방지
);

-- 알림 테이블
CREATE TABLE groume.notification (
    id BIGSERIAL PRIMARY KEY,                                           -- 알림 고유 ID
    user_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE,    -- 알림 받을 사용자 ID
    title VARCHAR(200) NOT NULL,                                       -- 알림 제목
    message TEXT NOT NULL,                                             -- 알림 내용
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('matching', 'message', 'mission', 'review', 'system')), -- 알림 타입
    data JSONB DEFAULT '{}',                                           -- 알림 추가 데이터 (JSON)
    is_read BOOLEAN DEFAULT false,                                    -- 읽음 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP     -- 알림 생성 일시
);

-- 신고 테이블
CREATE TABLE groume.report (
    id BIGSERIAL PRIMARY KEY,                                           -- 신고 고유 ID
    reporter_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE, -- 신고자 사용자 ID
    reported_user_id BIGINT NOT NULL REFERENCES groume.user(id) ON DELETE CASCADE, -- 신고당한 사용자 ID
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('harassment', 'inappropriate', 'fake_profile', 'spam', 'other')), -- 신고 타입
    reason TEXT NOT NULL,                                              -- 신고 사유
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')), -- 신고 처리 상태
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,    -- 신고 일시
    resolved_at TIMESTAMP WITH TIME ZONE,                             -- 신고 처리 완료 일시
    CHECK (reporter_id != reported_user_id)                           -- 자기 자신 신고 불가
);

-- 인덱스 생성
CREATE INDEX idx_user_email ON groume.user(email);
CREATE INDEX idx_user_username ON groume.user(username);
CREATE INDEX idx_user_region ON groume.user(region);
CREATE INDEX idx_user_age ON groume.user(age);
CREATE INDEX idx_user_rating ON groume.user(rating);

CREATE INDEX idx_meeting_leader ON groume.meeting(leader_id);
CREATE INDEX idx_meeting_status ON groume.meeting(status);
CREATE INDEX idx_meeting_region ON groume.meeting(preferred_region);
CREATE INDEX idx_meeting_created_at ON groume.meeting(created_at);
CREATE INDEX idx_meeting_expires_at ON groume.meeting(expires_at);

CREATE INDEX idx_meeting_member_meeting ON groume.meeting_member(meeting_id);
CREATE INDEX idx_meeting_member_user ON groume.meeting_member(user_id);

CREATE INDEX idx_matching_request_meeting ON groume.matching_request(meeting_id);
CREATE INDEX idx_matching_request_target ON groume.matching_request(target_meeting_id);
CREATE INDEX idx_matching_request_status ON groume.matching_request(status);
CREATE INDEX idx_matching_request_created_at ON groume.matching_request(created_at);

CREATE INDEX idx_matched_meeting_meeting1 ON groume.matched_meeting(meeting1_id);
CREATE INDEX idx_matched_meeting_meeting2 ON groume.matched_meeting(meeting2_id);
CREATE INDEX idx_matched_meeting_status ON groume.matched_meeting(status);

CREATE INDEX idx_chat_room_matched_meeting ON groume.chat_room(matched_meeting_id);

CREATE INDEX idx_message_chat_room ON groume.message(chat_room_id);
CREATE INDEX idx_message_sender ON groume.message(sender_id);
CREATE INDEX idx_message_created_at ON groume.message(created_at);

CREATE INDEX idx_ticket_user ON groume.ticket(user_id);
CREATE INDEX idx_ticket_is_used ON groume.ticket(is_used);
CREATE INDEX idx_ticket_expires_at ON groume.ticket(expires_at);

CREATE INDEX idx_user_mission_user ON groume.user_mission(user_id);
CREATE INDEX idx_user_mission_mission ON groume.user_mission(mission_id);
CREATE INDEX idx_user_mission_status ON groume.user_mission(status);

CREATE INDEX idx_review_reviewer ON groume.review(reviewer_id);
CREATE INDEX idx_review_reviewee ON groume.review(reviewee_id);
CREATE INDEX idx_review_matched_meeting ON groume.review(matched_meeting_id);

CREATE INDEX idx_notification_user ON groume.notification(user_id);
CREATE INDEX idx_notification_is_read ON groume.notification(is_read);
CREATE INDEX idx_notification_created_at ON groume.notification(created_at);

CREATE INDEX idx_report_reporter ON groume.report(reporter_id);
CREATE INDEX idx_report_reported_user ON groume.report(reported_user_id);
CREATE INDEX idx_report_status ON groume.report(status);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 적용
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON groume.user FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_updated_at BEFORE UPDATE ON groume.meeting FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 트리거 함수: 사용자 평점 업데이트
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE groume.user 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM groume.review 
            WHERE reviewee_id = NEW.reviewee_id
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM groume.review 
            WHERE reviewee_id = NEW.reviewee_id
        )
    WHERE id = NEW.reviewee_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 리뷰 생성 시 평점 업데이트 트리거
CREATE TRIGGER update_rating_after_review 
    AFTER INSERT ON groume.review 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_rating();

-- 트리거 함수: 티켓 개수 업데이트
CREATE OR REPLACE FUNCTION update_ticket_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE groume.user 
        SET ticket_count = ticket_count + NEW.amount 
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_used = false AND NEW.is_used = true THEN
        UPDATE groume.user 
        SET ticket_count = ticket_count - NEW.amount 
        WHERE id = NEW.user_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 티켓 변경 시 개수 업데이트 트리거
CREATE TRIGGER update_ticket_count_after_insert 
    AFTER INSERT ON groume.ticket 
    FOR EACH ROW 
    EXECUTE FUNCTION update_ticket_count();

CREATE TRIGGER update_ticket_count_after_update 
    AFTER UPDATE ON groume.ticket 
    FOR EACH ROW 
    EXECUTE FUNCTION update_ticket_count();

-- 기본 데이터 삽입
INSERT INTO groume.mission (title, description, mission_type, reward_tickets, requirements) VALUES
('일일 출석', '매일 앱에 접속하세요', 'daily', 1, '{"type": "login", "count": 1}'),
('첫 프로필 완성', '프로필을 100% 완성하세요', 'achievement', 5, '{"type": "profile_complete"}'),
('첫 미팅 신청', '첫 번째 미팅을 신청하세요', 'achievement', 3, '{"type": "first_meeting"}'),
('리뷰 작성', '미팅 후 리뷰를 작성하세요', 'special', 2, '{"type": "write_review", "count": 1}');

-- 초기 관리자 계정 (비밀번호: admin123)
INSERT INTO groume.user (username, email, password_hash, name, age, gender, region) VALUES
('admin', 'admin@groume.com', crypt('admin123', gen_salt('bf')), '관리자', 30, 'male', '서울');

COMMENT ON TABLE groume.user IS '사용자 정보';
COMMENT ON TABLE groume.meeting IS '미팅 신청 정보';
COMMENT ON TABLE groume.meeting_member IS '미팅 참가자';
COMMENT ON TABLE groume.matching_request IS '매칭 요청';
COMMENT ON TABLE groume.matched_meeting IS '성사된 매칭';
COMMENT ON TABLE groume.chat_room IS '채팅방';
COMMENT ON TABLE groume.message IS '메시지';
COMMENT ON TABLE groume.ticket IS '이용권';
COMMENT ON TABLE groume.mission IS '미션';
COMMENT ON TABLE groume.user_mission IS '사용자별 미션 진행상황';
COMMENT ON TABLE groume.review IS '사용자 리뷰';
COMMENT ON TABLE groume.notification IS '알림';
COMMENT ON TABLE groume.report IS '신고';
