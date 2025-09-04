import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/environment';
import { 
  Meeting, 
  MeetingMember,
  MatchingRequest, 
  CreateMeetingRequest, 
  CreateMatchingRequest,
  RespondToMatchingRequest,
  JoinMeetingResponse,
  ApiResponse,
  PaginatedResponse 
} from '../types';

// API 기본 URL (환경 설정 파일에서 가져옴)
const API_BASE_URL = API_CONFIG.BASE_URL;

// 매칭 상태 인터페이스
interface MatchingState {
  // 미팅 관련
  meetings: Meeting[];
  myMeetings: Meeting[];
  joinedMeetings: Meeting[]; // 참가한 미팅 목록 추가
  selectedMeeting: Meeting | null;
  meetingMembers: MeetingMember[]; // 미팅 참가자 목록 추가
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
  
  // 공통
  loading: boolean;
  error: string | null;
}

// 초기 상태
const initialState: MatchingState = {
  meetings: [],
  myMeetings: [],
  joinedMeetings: [],
  selectedMeeting: null,
  meetingMembers: [],
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

      const result: ApiResponse<Meeting> = await response.json();
      console.log('📥 응답 데이터:', result);
      
      if (!result.success) {
        return rejectWithValue(result.message || '미팅 생성에 실패했습니다.');
      }

      return result.data!;
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

      const result: ApiResponse<Meeting[]> = await response.json();
      
      if (!result.success) {
        return rejectWithValue(result.message || '미팅 목록을 불러오는데 실패했습니다.');
      }

      return result.data || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 내가 생성한 미팅 목록 조회
export const fetchMyMeetings = createAsyncThunk(
  'matching/fetchMyMeetings',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(`${API_BASE_URL}/matching/my-meetings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse<Meeting[]> = await response.json();
      
      if (!result.success) {
        return rejectWithValue(result.message || '내 미팅 목록을 불러오는데 실패했습니다.');
      }

      return result.data || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 참가한 미팅 목록 조회 (새로 추가)
export const fetchJoinedMeetings = createAsyncThunk(
  'matching/fetchJoinedMeetings',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(`${API_BASE_URL}/matching/joined-meetings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse<Meeting[]> = await response.json();
      
      if (!result.success) {
        return rejectWithValue(result.message || '참가한 미팅 목록을 불러오는데 실패했습니다.');
      }

      return result.data || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 미팅 참가 (새로 추가)
export const joinMeeting = createAsyncThunk(
  'matching/joinMeeting',
  async (meetingId: string, { rejectWithValue, getState }) => {
    try {
      console.log('🚀 미팅 참가 API 호출:', `${API_BASE_URL}/matching/meetings/${meetingId}/join`);
      
      const state = getState() as any;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('로그인이 필요합니다.');
      }
      
      const response = await fetch(`${API_BASE_URL}/matching/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 응답 상태:', response.status, response.statusText);

      const result: ApiResponse<JoinMeetingResponse> = await response.json();
      console.log('📥 응답 데이터:', result);
      
      if (!result.success) {
        return rejectWithValue(result.message || '미팅 참가에 실패했습니다.');
      }

      return result.data!;
    } catch (error) {
      console.log('❌ 네트워크 오류:', error);
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 미팅 참가 취소 (새로 추가)
export const leaveMeeting = createAsyncThunk(
  'matching/leaveMeeting',
  async (meetingId: string, { rejectWithValue, getState }) => {
    try {
      console.log('🚀 미팅 참가 취소 API 호출:', `${API_BASE_URL}/matching/meetings/${meetingId}/leave`);
      
      const state = getState() as any;
      const token = state.auth.token;
      
      if (!token) {
        return rejectWithValue('로그인이 필요합니다.');
      }
      
      const response = await fetch(`${API_BASE_URL}/matching/meetings/${meetingId}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📥 응답 상태:', response.status, response.statusText);

      const result: ApiResponse = await response.json();
      console.log('📥 응답 데이터:', result);
      
      if (!result.success) {
        return rejectWithValue(result.message || '미팅 참가 취소에 실패했습니다.');
      }

      return meetingId;
    } catch (error) {
      console.log('❌ 네트워크 오류:', error);
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 미팅 참가자 목록 조회 (새로 추가)
export const fetchMeetingMembers = createAsyncThunk(
  'matching/fetchMeetingMembers',
  async (meetingId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(`${API_BASE_URL}/matching/meetings/${meetingId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse<MeetingMember[]> = await response.json();
      
      if (!result.success) {
        return rejectWithValue(result.message || '참가자 목록을 불러오는데 실패했습니다.');
      }

      return result.data || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 기존 매칭 요청 관련 액션들...
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

      const result: ApiResponse<MatchingRequest> = await response.json();
      
      if (!result.success) {
        return rejectWithValue(result.message || '매칭 요청에 실패했습니다.');
      }

      return result.data!;
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

export const fetchReceivedRequests = createAsyncThunk(
  'matching/fetchReceivedRequests',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(`${API_BASE_URL}/matching/requests/received`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse<MatchingRequest[]> = await response.json();
      
      if (!result.success) {
        return rejectWithValue('받은 요청을 불러오는데 실패했습니다.');
      }

      return result.data || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

export const fetchSentRequests = createAsyncThunk(
  'matching/fetchSentRequests',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(`${API_BASE_URL}/matching/requests/sent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result: ApiResponse<MatchingRequest[]> = await response.json();
      
      if (!result.success) {
        return rejectWithValue('보낸 요청을 불러오는데 실패했습니다.');
      }

      return result.data || [];
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

export const respondToMatchingRequest = createAsyncThunk(
  'matching/respondToMatchingRequest',
  async ({ requestId, response: responseData }: { 
    requestId: string; 
    response: RespondToMatchingRequest; 
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const token = state.auth.token;

      const response = await fetch(`${API_BASE_URL}/matching/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(responseData),
      });

      const result: ApiResponse<MatchingRequest> = await response.json();
      
      if (!result.success) {
        return rejectWithValue(result.message || '요청 응답에 실패했습니다.');
      }

      return result.data!;
    } catch (error) {
      return rejectWithValue('네트워크 오류가 발생했습니다.');
    }
  }
);

// 슬라이스 생성
const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<typeof initialState.filters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSelectedMeeting: (state, action: PayloadAction<Meeting | null>) => {
      state.selectedMeeting = action.payload;
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
        state.meetings = action.payload;
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

    // 참가한 미팅 목록 조회 (새로 추가)
    builder
      .addCase(fetchJoinedMeetings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJoinedMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.joinedMeetings = action.payload;
      })
      .addCase(fetchJoinedMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 미팅 참가 (새로 추가)
    builder
      .addCase(joinMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinMeeting.fulfilled, (state, action) => {
        state.loading = false;
        // 미팅 목록에서 참가자 수 업데이트
        const meetingIndex = state.meetings.findIndex(m => m.id === action.payload.meeting.id);
        if (meetingIndex !== -1) {
          state.meetings[meetingIndex] = {
            ...state.meetings[meetingIndex],
            current_members: action.payload.current_members,
            is_joined: true
          };
        }
      })
      .addCase(joinMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 미팅 참가 취소 (새로 추가)
    builder
      .addCase(leaveMeeting.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(leaveMeeting.fulfilled, (state, action) => {
        state.loading = false;
        // 미팅 목록에서 참가자 수 업데이트
        const meetingIndex = state.meetings.findIndex(m => m.id === action.payload);
        if (meetingIndex !== -1) {
          const currentMembers = state.meetings[meetingIndex].current_members || 0;
          state.meetings[meetingIndex] = {
            ...state.meetings[meetingIndex],
            current_members: Math.max(0, currentMembers - 1),
            is_joined: false
          };
        }
        // 참가한 미팅 목록에서 제거
        state.joinedMeetings = state.joinedMeetings.filter(m => m.id !== action.payload);
      })
      .addCase(leaveMeeting.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 미팅 참가자 목록 조회 (새로 추가)
    builder
      .addCase(fetchMeetingMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetingMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.meetingMembers = action.payload;
      })
      .addCase(fetchMeetingMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // 매칭 요청 관련 리듀서들...
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

    builder
      .addCase(respondToMatchingRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(respondToMatchingRequest.fulfilled, (state, action) => {
        state.loading = false;
        const requestIndex = state.receivedRequests.findIndex(r => r.id === action.payload.id);
        if (requestIndex !== -1) {
          state.receivedRequests[requestIndex] = action.payload;
        }
      })
      .addCase(respondToMatchingRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// 액션 및 셀렉터 export
export const { clearError, setFilters, clearFilters, setSelectedMeeting } = matchingSlice.actions;

// 셀렉터들
export const selectMeetings = (state: { matching: MatchingState }) => state.matching.meetings;
export const selectMyMeetings = (state: { matching: MatchingState }) => state.matching.myMeetings;
export const selectJoinedMeetings = (state: { matching: MatchingState }) => state.matching.joinedMeetings;
export const selectSelectedMeeting = (state: { matching: MatchingState }) => state.matching.selectedMeeting;
export const selectMeetingMembers = (state: { matching: MatchingState }) => state.matching.meetingMembers;
export const selectMeetingsLoading = (state: { matching: MatchingState }) => state.matching.meetingsLoading;
export const selectReceivedRequests = (state: { matching: MatchingState }) => state.matching.receivedRequests;
export const selectSentRequests = (state: { matching: MatchingState }) => state.matching.sentRequests;
export const selectRequestsLoading = (state: { matching: MatchingState }) => state.matching.requestsLoading;
export const selectMeetingsPagination = (state: { matching: MatchingState }) => state.matching.meetingsPagination;
export const selectFilters = (state: { matching: MatchingState }) => state.matching.filters;
export const selectMatchingLoading = (state: { matching: MatchingState }) => state.matching.loading;
export const selectMatchingError = (state: { matching: MatchingState }) => state.matching.error;

export default matchingSlice.reducer;