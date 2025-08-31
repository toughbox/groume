// 사용자 타입 정의
export interface User {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  age: number;
  gender: 'male' | 'female';
  region: string;
  interests: string[];
  createdAt: string;
}

// 매칭 티켓 타입
export interface MatchingTicket {
  id: string;
  userId: string;
  isUsed: boolean;
  createdAt: string;
  expiresAt?: string;
}

// 미팅 신청 타입
export interface MeetingRequest {
  id: string;
  leaderId: string;
  members: User[];
  preferredAge: { min: number; max: number };
  preferredRegion: string;
  meetingStyle: string;
  availableDates: string[];
  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  createdAt: string;
}

// 인증 상태
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// 네비게이션 타입
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  MeetingRequest: undefined;
  Profile: undefined;
};
