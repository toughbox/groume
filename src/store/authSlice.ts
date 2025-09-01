import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// 사용자 정보 타입
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  region: string;
  phone?: string;
  profileImageUrl?: string;
  bio?: string;
  interests: string[];
  ticketCount: number;
  rating: number;
  ratingCount: number;
  createdAt: string;
  isActive: boolean;
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

// 비동기 액션: 회원가입
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      // TODO: 실제 API 호출로 교체
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || '회원가입에 실패했습니다.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 비동기 액션: 로그인
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      // TODO: 실제 API 호출로 교체
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || '로그인에 실패했습니다.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 비동기 액션: 로그아웃
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: 실제 API 호출로 교체 (서버에서 토큰 무효화)
      const response = await fetch('/api/auth/logout', {
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
        state.user = action.payload.user;
        state.token = action.payload.token;
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
