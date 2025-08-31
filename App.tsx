import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreenSimple';
import { CreateMeetingScreen } from './src/screens/CreateMeetingScreen';
import { User } from './src/types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'createMeeting'>('dashboard');

  const handleLogin = (username: string, password: string) => {
    // 임시 로그인 로직 - 실제로는 API 호출
    const mockUser = {
      id: '1',
      username: username,
      email: `${username}@example.com`,
      profileImage: undefined,
      age: 25,
      gender: 'male' as const,
      region: '서울',
      interests: ['영화', '맛집', '여행'],
      createdAt: new Date().toISOString(),
    };
    
    setUser(mockUser);
    setIsAuthenticated(true);
  };

  const handleCreateMeeting = () => {
    setCurrentScreen('createMeeting');
  };

  const handleBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const handleMeetingCreated = (meetingData: any) => {
    console.log('새 미팅 생성:', meetingData);
    setCurrentScreen('dashboard');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
              {!isAuthenticated ? (
          <LoginScreen onLogin={handleLogin} />
        ) : user ? (
          currentScreen === 'dashboard' ? (
            <DashboardScreen user={user} onCreateMeeting={handleCreateMeeting} />
          ) : (
            <CreateMeetingScreen 
              onBack={handleBackToDashboard} 
              onCreateMeeting={handleMeetingCreated}
            />
          )
        ) : null}
    </SafeAreaProvider>
  );
}
