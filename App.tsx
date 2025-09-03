import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { store } from './src/store';
import { LoginScreen } from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import { DashboardScreen } from './src/screens/DashboardScreenSimple';
import { CreateMeetingScreen } from './src/screens/CreateMeetingScreen';
import { MeetingListScreen } from './src/screens/MeetingListScreen';
import JoinedMeetingsScreen from './src/screens/JoinedMeetingsScreen';
import { useAppSelector } from './src/hooks/useAppDispatch';

// 네비게이션 타입 정의
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  CreateMeeting: undefined;
  MeetingList: undefined;
  JoinedMeetings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// 메인 네비게이션 컴포넌트
function MainNavigator() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // 인증되지 않은 사용자용 스크린
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // 인증된 사용자용 스크린
          <>
            <Stack.Screen name="Dashboard">
              {(props) => (
                <DashboardScreen 
                  {...props} 
                  onCreateMeeting={() => props.navigation.navigate('CreateMeeting')}
                  onJoinedMeetings={() => props.navigation.navigate('JoinedMeetings')}
                  onMeetingList={() => props.navigation.navigate('MeetingList')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="CreateMeeting">
              {(props) => (
                <CreateMeetingScreen 
                  {...props}
                  onBack={() => props.navigation.goBack()}
                  onSuccess={() => props.navigation.navigate('Dashboard')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="MeetingList">
              {(props) => (
                <MeetingListScreen 
                  {...props}
                  onBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="JoinedMeetings">
              {(props) => (
                <JoinedMeetingsScreen 
                  {...props}
                  onBack={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <MainNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
