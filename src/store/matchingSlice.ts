import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Meeting, 
  MatchingRequest, 
  CreateMeetingRequest, 
  CreateMatchingRequest,
  RespondToMatchingRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types';

// API 기본 URL
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.206.171:3030/api'  // 개발 환경: 실제 IP 주소와 포트 사용
  //? 'http://192.168.0.19:3030/api'
  : 'https://api.groume.com/api'; // 프로덕션 환경

// 매칭 상태 인터페이스
interface MatchingState {
  // 미팅 관련
  meetings: Meeting[];
  myMeetings: Meeting[];
  selectedMeeting: Meeting | null;
  meetingsLoading: boolean;
  
  // 매칭 요청 관련
  receivedRequests: MatchingRequest[];
  sentRequests: MatchingRequest[];
  requestsLoading: boolean;
  
  // 페이지네이션
  meetingsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // 필터
  filters: {
    region?: string;
    min_age?: number;
    max_age?: number;
    group_size?: number;
  };
  
  // 로딩 및 에러 상태
  loading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: MatchingState = {
  meetings: [],
  myMeetings: [],
  selectedMeeting: null,
  meetingsLoading: false,
  
  receivedRequests: [],
  sentRequests: [],
  requestsLoading: false,
  
  meetingsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  
  filters: {},
  
  loading: false,
  error: null,
};

// 비동기 액션들

// 새 미팅 생성
export const createMeeting = createAsyncThunk(
  'matching/createMeeting',
  async (meetingData: CreateMeetingRequest, { rejectWithValue, getState }) => {
    try {
      console.log('🚀 미팅 생성 API 호출:', `${API_BASE_URL}/matching/meetings`);
      console.log('📤 전송 데이터:', meetingData);
      
      // Redux 상태에서 토큰 가져오기
      const state = getState() as any;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('로그인이 필요합니다.');
      }
      
      const response = await fetch(`${API_BASE_URL}/matching/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(meetingData),
      });

      console.log('📥 응답 상태:', response.status, response.statusText);

      const result: ApiResponse<{ meeting: Meeting }> = await response.json();
      console.log('📥 응답 데이터:', result);
      
      if (!result.success) {
        return rejectWithValue(result.message || '미팅 생성에 실패했습니다.');
      }

      return result.data!.meeting;
    } catch (error) {
      console.log('❌ 네트워크 오류:', error);
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 매칭 가능한 미팅 목록 조회
export const fetchMeetings = createAsyncThunk(
  'matching/fetchMeetings',
  async (params: {
    page?: number;
    limit?: number;
    region?: string;
    min_age?: number;
    max_age?: number;
    group_size?: number;
  } = {}, { rejectWithValue, getState }) => {
    try {
      // Redux 상태에서 토큰 가져오기
      const state = getState() as any;
      const token = state.auth.token;
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/matching/meetings?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: PaginatedResponse<Meeting> = await response.json();
      
      if (!result.success) {
        return rejectWithValue('미팅 목록을 불러오는데 실패했습니다.');
      }

      return {
        meetings: result.data.meetings || [],
        pagination: result.data.pagination,
      };
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 내가 생성한 미팅 목록 조회
export const fetchMyMeetings = createAsyncThunk(
  'matching/fetchMyMeetings',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/matching/my-meetings?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: PaginatedResponse<Meeting> = await response.json();
      
      if (!result.success) {
        return rejectWithValue('내 미팅 목록을 불러오는데 실패했습니다.');
      }

      return result.data.meetings || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 매칭 요청 보내기
export const sendMatchingRequest = createAsyncThunk(
  'matching/sendMatchingRequest',
  async (requestData: CreateMatchingRequest, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;
      const response = await fetch(`${API_BASE_URL}/matching/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const result: ApiResponse<{ request: MatchingRequest }> = await response.json();
      
      if (!result.success) {
        return rejectWithValue(result.message || '매칭 요청에 실패했습니다.');
      }

      return result.data!.request;
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 받은 매칭 요청 목록 조회
export const fetchReceivedRequests = createAsyncThunk(
  'matching/fetchReceivedRequests',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        type: 'received',
        ...Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        ),
      });

      const response = await fetch(`${API_BASE_URL}/matching/requests?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: PaginatedResponse<MatchingRequest> = await response.json();
      
      if (!result.success) {
        return rejectWithValue('받은 요청 목록을 불러오는데 실패했습니다.');
      }

      return result.data.requests || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 보낸 매칭 요청 목록 조회
export const fetchSentRequests = createAsyncThunk(
  'matching/fetchSentRequests',
  async (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        type: 'sent',
        ...Object.fromEntries(
          Object.entries(params).filter(([_, value]) => value !== undefined)
        ),
      });

      const response = await fetch(`${API_BASE_URL}/matching/requests?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: PaginatedResponse<MatchingRequest> = await response.json();
      
      if (!result.success) {
        return rejectWithValue('보낸 요청 목록을 불러오는데 실패했습니다.');
      }

      return result.data.requests || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 매칭 요청에 응답하기
export const respondToMatchingRequest = createAsyncThunk(
  'matching/respondToMatchingRequest',
  async ({ requestId, response }: { requestId: string; response: RespondToMatchingRequest }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const apiResponse = await fetch(`${API_BASE_URL}/matching/requests/${requestId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(response),
      });

      const result: ApiResponse = await apiResponse.json();
      
      if (!result.success) {
        return rejectWithValue(result.message || '요청 응답에 실패했습니다.');
      }

      return { requestId, action: response.action };
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 매칭 슬라이스
const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    // 필터 설정
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
    },
    
    // 선택된 미팅 설정
    setSelectedMeeting: (state, action: PayloadAction<Meeting | null>) => {
      state.selectedMeeting = action.payload;
    },
    
    // 에러 클리어
    clearError: (state) => {
      state.error = null;
    },
    
    // 상태 리셋
    resetMatchingState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // 미팅 생성
    builder
      .addCase(createMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.loading = false;
        state.myMeetings.unshift(action.payload);
      })
      .addCase(createMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 미팅 목록 조회
    builder
      .addCase(fetchMeetings.pending, (state) => {
        state.meetingsLoading = true;
        state.error = null;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.meetingsLoading = false;
        state.meetings = action.payload.meetings;
        state.meetingsPagination = action.payload.pagination;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.meetingsLoading = false;
        state.error = action.payload as string;
      });

    // 내 미팅 목록 조회
    builder
      .addCase(fetchMyMeetings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.myMeetings = action.payload;
      })
      .addCase(fetchMyMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 매칭 요청 보내기
    builder
      .addCase(sendMatchingRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMatchingRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.sentRequests.unshift(action.payload);
      })
      .addCase(sendMatchingRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 받은 요청 목록 조회
    builder
      .addCase(fetchReceivedRequests.pending, (state) => {
        state.requestsLoading = true;
        state.error = null;
      })
      .addCase(fetchReceivedRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.receivedRequests = action.payload;
      })
      .addCase(fetchReceivedRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.error = action.payload as string;
      });

    // 보낸 요청 목록 조회
    builder
      .addCase(fetchSentRequests.pending, (state) => {
        state.requestsLoading = true;
        state.error = null;
      })
      .addCase(fetchSentRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.sentRequests = action.payload;
      })
      .addCase(fetchSentRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.error = action.payload as string;
      });

    // 매칭 요청 응답
    builder
      .addCase(respondToMatchingRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToMatchingRequest.fulfilled, (state, action) => {
        state.loading = false;
        const { requestId, action: responseAction } = action.payload;
        
        // 받은 요청 목록에서 상태 업데이트
        const requestIndex = state.receivedRequests.findIndex(req => req.id === requestId);
        if (requestIndex !== -1) {
          state.receivedRequests[requestIndex].status = responseAction === 'accept' ? 'accepted' : 'rejected';
          state.receivedRequests[requestIndex].responded_at = new Date().toISOString();
        }
      })
      .addCase(respondToMatchingRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 액션 내보내기
export const {
  setFilters,
  setSelectedMeeting,
  clearError,
  resetMatchingState,
} = matchingSlice.actions;

// 셀렉터
export const selectMeetings = (state: { matching: MatchingState }) => state.matching.meetings;
export const selectMyMeetings = (state: { matching: MatchingState }) => state.matching.myMeetings;
export const selectSelectedMeeting = (state: { matching: MatchingState }) => state.matching.selectedMeeting;
export const selectReceivedRequests = (state: { matching: MatchingState }) => state.matching.receivedRequests;
export const selectSentRequests = (state: { matching: MatchingState }) => state.matching.sentRequests;
export const selectMeetingsLoading = (state: { matching: MatchingState }) => state.matching.meetingsLoading;
export const selectRequestsLoading = (state: { matching: MatchingState }) => state.matching.requestsLoading;
export const selectMatchingLoading = (state: { matching: MatchingState }) => state.matching.loading;
export const selectMatchingError = (state: { matching: MatchingState }) => state.matching.error;
export const selectFilters = (state: { matching: MatchingState }) => state.matching.filters;
export const selectMeetingsPagination = (state: { matching: MatchingState }) => state.matching.meetingsPagination;

// 리듀서 내보내기
export default matchingSlice.reducer;
