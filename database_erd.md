# 멀팅 앱 데이터베이스 ERD

```mermaid
erDiagram
    USERS {
        string id PK
        string username UK
        string email UK
        string password_hash
        string name
        int age
        string gender
        string region
        string phone
        string profile_image_url
        text bio
        json interests
        int ticket_count
        float rating
        int rating_count
        datetime created_at
        datetime updated_at
        datetime last_login
        boolean is_active
    }

    MEETINGS {
        string id PK
        string title
        text description
        string leader_id FK
        int group_size
        int min_age
        int max_age
        string preferred_region
        string meeting_style
        json preferred_dates
        string status
        datetime created_at
        datetime updated_at
        datetime expires_at
    }

    MEETING_MEMBERS {
        string id PK
        string meeting_id FK
        string user_id FK
        string role
        datetime joined_at
        boolean is_confirmed
    }

    MATCHING_REQUESTS {
        string id PK
        string meeting_id FK
        string target_meeting_id FK
        string status
        string requester_id FK
        text message
        datetime created_at
        datetime expires_at
        datetime responded_at
    }

    MATCHED_MEETINGS {
        string id PK
        string meeting1_id FK
        string meeting2_id FK
        datetime matched_at
        string status
        string meeting_location
        datetime meeting_datetime
        datetime created_at
    }

    CHAT_ROOMS {
        string id PK
        string matched_meeting_id FK
        string name
        string type
        datetime created_at
        datetime last_message_at
        boolean is_active
    }

    MESSAGES {
        string id PK
        string chat_room_id FK
        string sender_id FK
        text content
        string message_type
        json metadata
        datetime created_at
        boolean is_deleted
        datetime read_at
    }

    TICKETS {
        string id PK
        string user_id FK
        string ticket_type
        int amount
        string source
        text description
        datetime created_at
        datetime expires_at
        boolean is_used
        datetime used_at
    }

    MISSIONS {
        string id PK
        string title
        text description
        string mission_type
        int reward_tickets
        json requirements
        boolean is_active
        datetime created_at
    }

    USER_MISSIONS {
        string id PK
        string user_id FK
        string mission_id FK
        string status
        int progress
        int max_progress
        datetime started_at
        datetime completed_at
        datetime claimed_at
    }

    REVIEWS {
        string id PK
        string reviewer_id FK
        string reviewee_id FK
        string matched_meeting_id FK
        float rating
        text comment
        datetime created_at
    }

    NOTIFICATIONS {
        string id PK
        string user_id FK
        string title
        text message
        string notification_type
        json data
        boolean is_read
        datetime created_at
    }

    REPORTS {
        string id PK
        string reporter_id FK
        string reported_user_id FK
        string report_type
        text reason
        string status
        datetime created_at
        datetime resolved_at
    }

    %% Relationships
    USERS ||--o{ MEETINGS : "creates"
    USERS ||--o{ MEETING_MEMBERS : "joins"
    MEETINGS ||--o{ MEETING_MEMBERS : "has"
    
    MEETINGS ||--o{ MATCHING_REQUESTS : "requests"
    MEETINGS ||--o{ MATCHING_REQUESTS : "receives"
    USERS ||--o{ MATCHING_REQUESTS : "makes"
    
    MEETINGS ||--o{ MATCHED_MEETINGS : "matches_with"
    MATCHED_MEETINGS ||--|| CHAT_ROOMS : "creates"
    
    CHAT_ROOMS ||--o{ MESSAGES : "contains"
    USERS ||--o{ MESSAGES : "sends"
    
    USERS ||--o{ TICKETS : "owns"
    USERS ||--o{ USER_MISSIONS : "participates"
    MISSIONS ||--o{ USER_MISSIONS : "assigned_to"
    
    USERS ||--o{ REVIEWS : "gives"
    USERS ||--o{ REVIEWS : "receives"
    MATCHED_MEETINGS ||--o{ REVIEWS : "reviewed_for"
    
    USERS ||--o{ NOTIFICATIONS : "receives"
    
    USERS ||--o{ REPORTS : "makes"
    USERS ||--o{ REPORTS : "reported_in"
```

## 테이블 설명

### 핵심 테이블
1. **USERS**: 사용자 기본 정보 및 프로필
2. **MEETINGS**: 미팅 신청 정보
3. **MEETING_MEMBERS**: 미팅 참가자 관리
4. **MATCHING_REQUESTS**: 미팅 간 매칭 요청
5. **MATCHED_MEETINGS**: 성사된 매칭 정보

### 부가 기능 테이블
6. **CHAT_ROOMS & MESSAGES**: 실시간 채팅
7. **TICKETS & MISSIONS**: 게임화 요소
8. **REVIEWS**: 사용자 평가 시스템
9. **NOTIFICATIONS**: 푸시 알림 관리
10. **REPORTS**: 신고 및 관리 시스템

이 ERD를 기반으로 PostgreSQL 스키마를 생성할 수 있습니다.
