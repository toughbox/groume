import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Button, Input } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('로그인 실패', '아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onLogin(username, password);
    } catch (error) {
      Alert.alert('로그인 실패', '아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 로고 */}
          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              <View style={styles.heartLogo}>
                <Text style={styles.heartText}>♥</Text>
              </View>
              <Text style={styles.logo}>그루미</Text>
            </View>
            <Text style={styles.tagline}>신나는 단체 미팅</Text>
          </View>

          {/* 로그인 폼 */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>로그인</Text>
            
            <Input
              placeholder="아이디를 입력하세요"
              value={username}
              onChangeText={setUsername}
              leftIcon={{ type: 'feather', name: 'user', color: '#FF6B6B' }}
              inputContainerStyle={styles.inputContainer}
              containerStyle={styles.inputWrapper}
            />

            <Input
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={{ type: 'feather', name: 'lock', color: '#FF6B6B' }}
              inputContainerStyle={styles.inputContainer}
              containerStyle={styles.inputWrapper}
            />

            <Button
              title="로그인"
              onPress={handleLogin}
              loading={isLoading}
              buttonStyle={styles.loginButton}
              titleStyle={styles.buttonText}
            />

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                계정이 없으신가요?{' '}
                <Text style={styles.signupLink}>회원가입</Text>
              </Text>
            </View>
          </View>

          {/* 소셜 로그인 */}
          {/*
          <View style={styles.socialContainer}>
            <Text style={styles.dividerText}>소셜 로그인 (준비 중)</Text>
            
            <Button
              title="🍒 카카오로 시작하기"
              onPress={() => {}}
              disabled
              buttonStyle={[styles.socialButton, styles.kakaoButton]}
              titleStyle={styles.socialButtonText}
            />
            
            <Button
              title="📧 구글로 시작하기"
              onPress={() => {}}
              disabled
              buttonStyle={[styles.socialButton, styles.googleButton]}
              titleStyle={styles.socialButtonText}
            />
          </View>
          */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heartLogo: {
    marginRight: 10,
  },
  heartText: {
    fontSize: 40,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FF6B6B',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  tagline: {
    fontSize: 18,
    color: '#7F8C8D',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: '400',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2C3E50',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  inputWrapper: {
    marginBottom: 10,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  signupContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  signupText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: '400',
  },
  signupLink: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
  },
  socialContainer: {
    alignItems: 'center',
  },
  dividerText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: '400',
  },
  socialButton: {
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
    width: '100%',
  },
  kakaoButton: {
    backgroundColor: '#E0E0E0',
  },
  googleButton: {
    backgroundColor: '#E0E0E0',
  },
  socialButtonText: {
    color: '#9E9E9E',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'Roboto',
    fontWeight: '500',
  },
});
