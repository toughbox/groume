import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// 사용자 정보 타입
export interface User {
  id: string;  // 백엔드에서 string으로 반환
  username: string;
  email: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  region: string;
  phone?: string;
  profile_image_url?: string;  // 백엔드 snake_case에 맞춤
  bio?: string;
  interests?: string[];  // 선택적 필드로 변경
  ticket_count: number;  // 백엔드 snake_case에 맞춤
  rating: string;  // 백엔드에서 decimal string으로 반환
  rating_count: number;  // 백엔드 snake_case에 맞춤
  created_at: string;  // 백엔드 snake_case에 맞춤
  is_active?: boolean;  // 선택적 필드로 변경
}

// 회원가입 요청 데이터 타입
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  region: string;
  phone?: string;
  bio?: string;
}

// 로그인 요청 데이터 타입
export interface LoginRequest {
  username: string;
  password: string;
}

// Auth 상태 타입
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// 초기 상태
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// API 베이스 URL 설정
// React Native에서 localhost 대신 실제 IP 주소 사용
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.0.19:3030/api'  // 개발 환경: 실제 IP 주소와 포트 사용
  //? 'http://192.168.206.171:3030/api'
  : 'https://api.groume.com/api'; // 프로덕션 환경: 실제 서버 URL

// 비동기 액션: 회원가입
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      console.log('🚀 회원가입 API 호출:', `${API_BASE_URL}/auth/register`);
      console.log('📤 전송 데이터:', userData);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('📥 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.log('❌ API 오류 응답:', error);
        return rejectWithValue(error.message || '회원가입에 실패했습니다.');
      }

      const data = await response.json();
      console.log('✅ 회원가입 성공:', data);
      return data;
    } catch (error) {
      console.log('❌ 네트워크 오류:', error);
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 비동기 액션: 로그인
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      console.log('🚀 로그인 API 호출:', `${API_BASE_URL}/auth/login`);
      console.log('📤 전송 데이터:', credentials);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📥 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.log('❌ API 오류 응답:', error);
        return rejectWithValue(error.message || '로그인에 실패했습니다.');
      }

      const data = await response.json();
      console.log('✅ 로그인 성공:', data);
      return data;
    } catch (error) {
      console.log('❌ 네트워크 오류:', error);
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 비동기 액션: 로그아웃
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
      });

      if (!response.ok) {
        return rejectWithValue('로그아웃에 실패했습니다.');
      }

      return true;
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 에러 클리어
    clearError: (state) => {
      state.error = null;
    },
    // 로딩 상태 설정
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    // 토큰 설정 (자동 로그인용)
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    // 사용자 정보 업데이트
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // 회원가입
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // 백엔드 응답 구조에 맞게 수정
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // 로그인
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // 백엔드 응답 구조: { success, message, data: { user, token } }
        state.user = action.payload.data.user;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // 로그아웃
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading, setToken, updateUser } = authSlice.actions;
export default authSlice.reducer;
