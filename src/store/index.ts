import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import matchingReducer from './matchingSlice';

// Redux Store 설정
export const store = configureStore({
  reducer: {
    auth: authReducer,
    matching: matchingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// RootState 타입 정의
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch 타입 정의
export type AppDispatch = typeof store.dispatch;

export default store;
