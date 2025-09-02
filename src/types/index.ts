// 사용자 타입 정의
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  profileImage?: string;
  profile_image_url?: string;
  age: number;
  gender: 'male' | 'female';
  region: string;
  interests: string[];
  ticket_count: number;
  rating: number;
  rating_count: number;
  createdAt: string;
  created_at?: string;
  bio?: string;
}

// 매칭 티켓 타입
export interface MatchingTicket {
  id: string;
  user_id: string;
  ticket_type: 'meeting' | 'bonus' | 'mission';
  amount: number;
  source: string;
  description?: string;
  is_used: boolean;
  created_at: string;
  expires_at?: string;
  used_at?: string;
}

// 미팅 타입
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  leader_id: string;
  group_size: number;
  min_age: number;
  max_age: number;
  preferred_region: string;
  meeting_place: string;
  preferred_dates: string[];
  status: 'active' | 'matched' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string;
  // 조인된 정보
  leader_name?: string;
  leader_age?: number;
  leader_region?: string;
  leader_profile_image?: string;
  leader_rating?: number;
  confirmed_members_count?: number;
}

// 미팅 멤버 타입
export interface MeetingMember {
  id: string;
  meeting_id: string;
  user_id: string;
  role: 'leader' | 'member';
  joined_at: string;
  is_confirmed: boolean;
}

// 매칭 요청 타입
export interface MatchingRequest {
  id: string;
  meeting_id: string;
  target_meeting_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  requester_id: string;
  message?: string;
  created_at: string;
  expires_at: string;
  responded_at?: string;
  // 조인된 정보
  meeting_title?: string;
  meeting_group_size?: number;
  meeting_region?: string;
  target_meeting_title?: string;
  target_meeting_group_size?: number;
  target_meeting_region?: string;
  requester_name?: string;
  requester_profile_image?: string;
  target_leader_name?: string;
  target_leader_profile_image?: string;
}

// 매칭된 미팅 타입
export interface MatchedMeeting {
  id: string;
  meeting1_id: string;
  meeting2_id: string;
  matched_at: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_location?: string;
  meeting_datetime?: string;
  created_at: string;
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items?: T[];
    meetings?: T[];
    requests?: T[];
    pagination: {
      page: number;
      limit: number;
      total?: number;
      totalPages?: number;
    };
  };
}

// 미팅 생성 요청 타입
export interface CreateMeetingRequest {
  title: string;
  description?: string;
  group_size: number;
  min_age: number;
  max_age: number;
  preferred_region: string;
  meeting_place: string;
  preferred_dates: string[];
  members?: Array<{
    user_id: string;
    name?: string;
  }>;
}

// 매칭 요청 생성 타입
export interface CreateMatchingRequest {
  meeting_id: string;
  target_meeting_id: string;
  message?: string;
}

// 매칭 요청 응답 타입
export interface RespondToMatchingRequest {
  action: 'accept' | 'reject';
}

// 네비게이션 타입
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  CreateMeeting: undefined;
  MeetingList: undefined;
  MeetingDetail: { meetingId: string };
  MatchingRequests: undefined;
  MyMeetings: undefined;
  Profile: undefined;
};
